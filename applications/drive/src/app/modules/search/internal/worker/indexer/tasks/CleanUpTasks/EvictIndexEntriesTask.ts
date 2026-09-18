import { Logger } from '../../../../shared/Logger';
import {
    SEARCH_EVICTION_HISTOGRAM_BUCKETS,
    SEARCH_EVICTION_MAX_REMOVALS_PER_RUN,
    SEARCH_EVICTION_MIN_INTERVAL_MS,
    SEARCH_EVICTION_REMOVAL_RATIO,
    SEARCH_EVICTION_TRIGGER_RATIO,
    SEARCH_MAX_INDEXED_DOCUMENTS,
} from '../../../../shared/config';
import { classifyError, isAbortError, sendErrorReportForSearch } from '../../../../shared/errors';
import { yieldToEventLoop } from '../../../../shared/yieldToEventLoop';
import type { IndexInstance, IndexKind } from '../../../index/IndexRegistry';
import { engineCall } from '../../../index/engineCall';
import { DEFAULT_BATCH_SIZE, exportEntries, removeDocumentIds } from '../../../index/indexEntriesUtils';
import { IndexPopulator } from '../../indexPopulators/IndexPopulator';
import { readEntryRecency } from '../../utils/entryRecency';
import type { IndexerTaskKind, TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';
import { CleanUpStaleBlobsTask } from './CleanUpStaleBlobsTask';

// Hand the worker event loop back to pending `postMessage`s (search queries) every this many
// processed entries, in both scan passes. Same rationale and value as CleanUpStaleIndexEntryTask.
const YIELD_EVENT_LOOP_EVERY = 200;

// How long to wait before retrying a sweep when a search/export read is in flight. Same value and
// rationale as CleanUpStaleBlobsTask: eviction is bounded maintenance, never urgent, so a live
// query always wins.
const EVICTION_DEFER_ON_ACTIVE_READ_MS = 5_000;

/**
 * Evicts the oldest index entries (by recency) from an index once it exceeds
 * SEARCH_EVICTION_TRIGGER_RATIO * SEARCH_MAX_INDEXED_DOCUMENTS, removing a fixed
 * SEARCH_EVICTION_REMOVAL_RATIO * SEARCH_MAX_INDEXED_DOCUMENTS per sweep.
 *
 * Picks victims via a two-pass histogram scan rather than sorting (id, recency) pairs in memory: a
 * fixed-size histogram stays cheap regardless of index size, in a worker whose WASM high-water mark
 * never shrinks. Pass 1 is a read-only export scan (cheap, does not leak). Pass 2 collects victim
 * ids in a second read-only scan, closes the export, THEN removes them in batches - removal must
 * never run inside an open export to avoid growing/leaking memory.
 */
export class EvictIndexEntriesTask extends BaseTask {
    constructor(private readonly indexKind: IndexKind) {
        super();
    }

    getUid(): string {
        return `${this.getKind()}:${this.indexKind}`;
    }

    getKind(): IndexerTaskKind {
        return 'evict-index-entries-task';
    }

    async execute(ctx: TaskContext): Promise<void> {
        Logger.info(`Running: ${this.getUid()}`);

        // Peek, never build: an index nobody has opened this session isn't worth building just to
        // maybe evict from (same precedent as gatherSearchDiagnostics).
        const instance = ctx.indexRegistry.peek(this.indexKind);
        if (!instance) {
            return;
        }

        if (instance.blobStore.hasActiveReads()) {
            Logger.info(`${this.getUid()}: deferring - a search/export read is in flight`);
            ctx.enqueueDelayed(new EvictIndexEntriesTask(this.indexKind), EVICTION_DEFER_ON_ACTIVE_READ_MS);
            return;
        }

        const trigger = Math.round(SEARCH_MAX_INDEXED_DOCUMENTS * SEARCH_EVICTION_TRIGGER_RATIO);
        const removal = Math.round(SEARCH_MAX_INDEXED_DOCUMENTS * SEARCH_EVICTION_REMOVAL_RATIO);

        const count = await ctx.db.getIndexEntryCount(this.indexKind);
        if (count === undefined || count <= trigger) {
            return;
        }

        const lastEvictionAt = await ctx.db.getLastEvictionAt(this.indexKind);
        if (lastEvictionAt !== undefined && Date.now() - lastEvictionAt < SEARCH_EVICTION_MIN_INTERVAL_MS) {
            Logger.info(`${this.getUid()}: skipping - last sweep was too recent`);
            return;
        }

        const toRemove = Math.min(removal, SEARCH_EVICTION_MAX_REMOVALS_PER_RUN);

        try {
            const threshold = await this.computeRecencyThreshold(instance, ctx, toRemove);
            const removedCount = await this.removeOldestEntries(instance, ctx, threshold, toRemove);

            Logger.info(`${this.getUid()}: removed ${removedCount} entries below recency threshold ${threshold}`);

            if (removedCount === 0) {
                // Nothing was evicted, so nothing about the index became partial. Reachable when
                // the persisted indexEntryCount that triggered this sweep is stale and higher than
                // what the engine actually holds. `capped` is sticky (only a full re-index clears
                // it), so marking it here would leave the user on "Search recent items" forever
                // over an eviction that never happened.
                return;
            }

            await this.markActivePopulatorsCapped(ctx);
            ctx.notifyIndexingProgress();
            await ctx.db.setLastEvictionAt(this.indexKind, Date.now());
            await new CleanUpStaleBlobsTask().execute(ctx);

            // Re-read rather than computing `count - removedCount`: every removal commit above
            // already persisted the engine's authoritative post-commit count (WriteEventKind.Stats
            // -> setIndexEntryCount), and the pre-sweep `count` can disagree with reality - it is a
            // cached value that may predate a crash, or belong to an index the engine has since
            // changed. Subtracting from a stale number schedules sweeps that have nothing to do.
            const remainingCount = await ctx.db.getIndexEntryCount(this.indexKind);
            ctx.searchMetrics.markIndexEvicted({ indexEntryCount: remainingCount ?? count, removedCount });
            if (remainingCount !== undefined && remainingCount > trigger) {
                ctx.enqueueDelayed(new EvictIndexEntriesTask(this.indexKind), SEARCH_EVICTION_MIN_INTERVAL_MS);
            }
        } catch (e) {
            if (isAbortError(e) || classifyError(e).kind === 'permanent') {
                throw e;
            }
            sendErrorReportForSearch(`${this.getUid()}: failed for engine <${this.indexKind}>`, e, {
                tags: { indexKind: this.indexKind },
            });
        }
    }

    /**
     * Pass 1 (read-only): stream every entry, bucketing its recency into a fixed-size equal-width
     * histogram over [0, now] - a fixed absolute range rather than one derived from the data, so
     * this stays a single scan (no separate min/max sub-pass is needed to size the buckets).
     * Returns the recency value below which removing entries reaches `toRemove` removals, counting
     * from the oldest (lowest-recency) bucket up.
     */
    private async computeRecencyThreshold(
        instance: IndexInstance,
        ctx: TaskContext,
        toRemove: number
    ): Promise<number> {
        const now = Date.now();
        const bucketWidth = now / SEARCH_EVICTION_HISTOGRAM_BUCKETS;
        const counts = new Int32Array(SEARCH_EVICTION_HISTOGRAM_BUCKETS);

        let observedMin: number | undefined;
        let observedMax: number | undefined;
        let processedSinceYield = 0;

        for await (const entry of exportEntries(instance, ctx.signal)) {
            const recency = readEntryRecency(entry);
            observedMin = observedMin === undefined ? recency : Math.min(observedMin, recency);
            observedMax = observedMax === undefined ? recency : Math.max(observedMax, recency);

            const bucket = Math.min(
                SEARCH_EVICTION_HISTOGRAM_BUCKETS - 1,
                Math.max(0, Math.floor(recency / bucketWidth))
            );
            counts[bucket]++;

            if (++processedSinceYield >= YIELD_EVENT_LOOP_EVERY) {
                await yieldToEventLoop();
                processedSinceYield = 0;
            }
        }

        // Degenerate case: nothing to evict from, or every entry shares the same recency. There's
        // no meaningful "oldest" subset in the latter case, so any `toRemove` of them are equally
        // valid victims - returning a threshold one above the shared value makes pass 2's strict
        // `recency < threshold` match everyone, and its own `toRemove` cap still bounds the count.
        if (observedMin === undefined || observedMax === undefined) {
            return 0;
        }
        if (observedMin === observedMax) {
            return observedMax + 1;
        }

        let cumulative = 0;
        for (let bucket = 0; bucket < counts.length; bucket++) {
            cumulative += counts[bucket];
            if (cumulative >= toRemove) {
                // Threshold is the upper edge of this bucket: entries strictly below it are the
                // ones pass 2 removes, so a bucket that alone reaches toRemove is fully included.
                return (bucket + 1) * bucketWidth;
            }
        }

        // toRemove exceeds the whole index (shouldn't happen: toRemove is bounded by the eviction
        // ratio applied to a count already confirmed to exceed the trigger) - remove everything.
        return now;
    }

    /**
     * Pass 2 (read-only scan, then writes): collect ids whose recency is below `threshold`, capped
     * at `toRemove`, close the export, THEN remove them in DEFAULT_BATCH_SIZE batches. Removal is
     * deliberately kept outside the open export - see the class doc comment.
     */
    private async removeOldestEntries(
        instance: IndexInstance,
        ctx: TaskContext,
        threshold: number,
        toRemove: number
    ): Promise<number> {
        const idsToRemove: string[] = [];
        let processedSinceYield = 0;

        for await (const entry of exportEntries(instance, ctx.signal)) {
            if (idsToRemove.length >= toRemove) {
                break;
            }
            const recency = readEntryRecency(entry);
            if (recency < threshold) {
                idsToRemove.push(engineCall('read entry identifier', () => entry.identifier()));
            }

            if (++processedSinceYield >= YIELD_EVENT_LOOP_EVERY) {
                await yieldToEventLoop();
                processedSinceYield = 0;
            }
        }

        let removedCount = 0;
        for (let i = 0; i < idsToRemove.length; i += DEFAULT_BATCH_SIZE) {
            ctx.signal.throwIfAborted();
            const batch = idsToRemove.slice(i, i + DEFAULT_BATCH_SIZE);
            removedCount += await removeDocumentIds(instance, batch, ctx.signal);
        }
        return removedCount;
    }

    /** Every populator targeting this index kind is marked capped: eviction removed entries from
     * the whole index kind, not from one populator's subtree specifically. */
    private async markActivePopulatorsCapped(ctx: TaskContext): Promise<void> {
        for (const { indexPopulatorKind, treeEventScopeId } of ctx.activeIndexPopulators) {
            const populator = ctx.getIndexPopulator(IndexPopulator.buildUid(indexPopulatorKind, treeEventScopeId));
            if (populator && populator.indexKind === this.indexKind) {
                await populator.markAsCapped(ctx.db);
            }
        }
    }
}
