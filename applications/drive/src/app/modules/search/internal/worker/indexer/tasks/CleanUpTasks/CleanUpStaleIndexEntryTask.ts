import type { Entry } from '@proton/proton-foundation-search';

import { Logger } from '../../../../shared/Logger';
import type { IndexPopulatorState } from '../../../../shared/SearchDB';
import { classifyError, isAbortError, sendErrorReportForSearch } from '../../../../shared/errors';
import { yieldToEventLoop } from '../../../../shared/yieldToEventLoop';
import type { IndexInstance } from '../../../index/IndexRegistry';
import { engineCall } from '../../../index/engineCall';
import { DEFAULT_BATCH_SIZE, exportEntries, removeDocumentIds } from '../../../index/indexEntriesUtils';
import type { IndexerTaskKind, TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

// Hand the worker event loop back to pending `postMessage`s (search queries) every
// this many processed entries. The number is low enough to make sure
// the event loop can take over every ~ dozen of ms.
const YIELD_EVENT_LOOP_EVERY = 200;

/**
 * Removes stale entries from every IndexInstance.
 *
 * Policy: an entry is kept iff its (indexPopulatorKind, treeEventScopeId, version,
 * generation) tuple matches a populator state, AND both its populator kind and
 * tree-event-scope id are still in `ctx.activePopulatorKinds` /
 * `ctx.activeTreeEventScopeIds`. Entries are deleted when they:
 *  - come from a previous generation / version,
 *  - have no matching populator state (orphan),
 *  - belong to a populator kind that is no longer active (removed, disabled, unregistered),
 *  - belong to a tree-event-scope that is no longer active (volume unshared, etc.),
 *  - are missing one or more of the core classification attributes (unclassifiable).
 *
 * Runs in two phases per instance - scan the whole index, then remove - because removing while the
 * export is still open prevents the blob store from freeing anything (see `cleanupInstance`).
 */
export class CleanUpStaleIndexEntryTask extends BaseTask {
    getUid(): string {
        return this.getKind();
    }

    getKind(): IndexerTaskKind {
        return 'cleanup-stale-index-entries-task';
    }

    async execute(ctx: TaskContext): Promise<void> {
        Logger.info(`Running: ${this.getUid()}`);

        const allStates = await ctx.db.getAllPopulatorStates();
        const activePopulatorKinds = new Set(ctx.activeIndexPopulators.map((p) => p.indexPopulatorKind));
        const activeTreeEventScopeIds = new Set(ctx.activeIndexPopulators.map((p) => p.treeEventScopeId));

        for (const instance of ctx.indexRegistry.getAll()) {
            try {
                await this.cleanupInstance(
                    instance,
                    allStates,
                    activePopulatorKinds,
                    activeTreeEventScopeIds,
                    ctx.signal
                );
            } catch (e) {
                if (isAbortError(e) || classifyError(e).kind === 'permanent') {
                    throw e;
                }
                sendErrorReportForSearch(`${this.getUid()}: failed for engine <${instance.indexKind}>`, e, {
                    tags: { indexKind: instance.indexKind },
                });
            }
        }
    }

    private async cleanupInstance(
        instance: IndexInstance,
        allStates: IndexPopulatorState[],
        activePopulatorKinds: Set<string>,
        activeTreeEventScopeIds: Set<string>,
        signal: AbortSignal
    ): Promise<void> {
        // Index states by uid ("populatorKind:treeEventScopeId") for O(1) lookup per exported entry.
        const stateByUid = new Map<string, IndexPopulatorState>();
        for (const state of allStates) {
            stateByUid.set(state.uid, state);
        }

        // Two phases, deliberately not interleaved: collect every stale id while the export is
        // open, then close it before removing anything.
        //
        // exportEntries holds IndexBlobStore in a "read" state for its entire scan. Committing a
        // removal inside that scan would still evict blobs from the 20-slot cache to make room,
        // but each evicted blob can't be freed while the store is busy reading, so it lands in the
        // unbounded pendingFrees queue instead - held there for the rest of the scan, not just
        // until the next commit. Measured on a 10k-document index removing 3k entries: 550
        // deferred frees and WASM growing ~200MB -> ~2000MB, versus no growth at all when the
        // removals happen after the export is closed. The queue does drain once the scan ends, but
        // WASM memory never shrinks (see getWasmMemoryBytes), so that peak becomes the worker's
        // permanent floor for the rest of the session and can reach the allocator-abort threshold.
        //
        // The cost of this shape is holding the stale ids in memory: ~40 bytes each, bounded by the
        // number of stale entries rather than by index size.
        const staleIds: string[] = [];
        let processedSinceYield = 0;
        for await (const entry of exportEntries(instance, signal)) {
            if (isEntryStale(entry, stateByUid, activePopulatorKinds, activeTreeEventScopeIds)) {
                staleIds.push(engineCall('read entry identifier', () => entry.identifier()));
            }
            if (++processedSinceYield >= YIELD_EVENT_LOOP_EVERY) {
                await yieldToEventLoop();
                processedSinceYield = 0;
            }
        }

        Logger.info(`${this.getUid()}: ${staleIds.length} stale entries collected for <${instance.indexKind}>`);

        // The export is closed here: deferred frees can drain, and each commit (for each remove operation) below
        // frees its own removed blobs immediately.
        let totalRemoved = 0;
        for (let i = 0; i < staleIds.length; i += DEFAULT_BATCH_SIZE) {
            totalRemoved += await removeDocumentIds(instance, staleIds.slice(i, i + DEFAULT_BATCH_SIZE), signal);
        }

        if (totalRemoved > 0) {
            Logger.info(`${this.getUid()}: removed ${totalRemoved} stale entries for <${instance.indexKind}>`);
        }
    }
}

function isEntryStale(
    entry: Entry,
    stateByUid: Map<string, IndexPopulatorState>,
    activePopulatorKinds: Set<string>,
    activeTreeEventScopeIds: Set<string>
): boolean {
    const populatorKind = readSearchLibraryTagAttribute(entry, 'indexPopulatorKind');
    const treeEventScopeId = readSearchLibraryTagAttribute(entry, 'treeEventScopeId');
    const version = readSearchLibraryIntegerAttribute(entry, 'indexPopulatorVersion');
    const generation = readSearchLibraryIntegerAttribute(entry, 'indexPopulatorGeneration');

    if (
        populatorKind === undefined ||
        treeEventScopeId === undefined ||
        version === undefined ||
        generation === undefined
    ) {
        // Malformed index entry: we can't classify it, so we mark it as stale.
        Logger.warn(
            `Malformed index entry ${engineCall('read entry identifier', () => entry.identifier())}: ` +
                `indexPopulatorKind=${populatorKind}, treeEventScopeId=${treeEventScopeId}, ` +
                `indexPopulatorVersion=${version}, indexPopulatorGeneration=${generation}`
        );
        return true;
    }

    const state = stateByUid.get(`${populatorKind}:${treeEventScopeId}`);
    if (!state) {
        // Orphan: no state for this (populatorKind, treeEventScopeId). Mark as stale.
        return true;
    }

    if (!activePopulatorKinds.has(populatorKind)) {
        return true;
    }
    // Remove entries from untracked treeEventScopeId (volume unshared, recovery volume, ...)
    if (!activeTreeEventScopeIds.has(treeEventScopeId)) {
        return true;
    }
    // Remove entries from previous versions or generations.
    return state.version !== version || state.generation !== generation;
}

function readSearchLibraryTagAttribute(entry: Entry, name: string): string | undefined {
    return engineCall(`read tag attribute <${name}>`, () => {
        const values = entry.attribute(name);
        let found: string | undefined;
        for (const ev of values) {
            if (found === undefined) {
                const raw = ev.value();
                if (typeof raw === 'string') {
                    found = raw;
                }
            }
            ev.free();
        }
        return found;
    });
}

function readSearchLibraryIntegerAttribute(entry: Entry, name: string): number | undefined {
    return engineCall(`read integer attribute <${name}>`, () => {
        const values = entry.attribute(name);
        let found: number | undefined;
        for (const ev of values) {
            if (found === undefined) {
                const raw = ev.value();
                // WASM returns integer attributes as plain `number` on export, even though
                // they were written via `Value.int(bigint)`. Values always originate from
                // `BigInt(…)` wrapping a `number` in `createIndexEntry`, so the round-trip
                // to a plain `number` is lossless for our use.
                if (typeof raw === 'number') {
                    found = raw;
                } else if (typeof raw === 'bigint') {
                    found = Number(raw);
                }
            }
            ev.free();
        }
        return found;
    });
}
