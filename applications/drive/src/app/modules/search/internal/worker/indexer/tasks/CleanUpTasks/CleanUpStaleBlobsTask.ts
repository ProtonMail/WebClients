import type { Cleanup } from '@proton/proton-foundation-search';
import { CleanupEventKind } from '@proton/proton-foundation-search';

import { Logger } from '../../../../shared/Logger';
import { classifyError, isAbortError, sendErrorReportForSearch } from '../../../../shared/errors';
import type { IndexBlobStore } from '../../../index/IndexBlobStore';
import type { IndexInstance, IndexKind } from '../../../index/IndexRegistry';
import { engineCall, maybeWrapAsSearchLibraryError } from '../../../index/engineCall';
import type { IndexerTaskKind, TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

// How long to wait before retrying cleanup when a search/export read is in flight.
const CLEANUP_DEFER_ON_ACTIVE_READ_MS = 5_000;

// Remove blobs from IndexedDB that are no longer referenced by any engine using the
// CleanUp API from search library.
//
// Clean-up removes unused blobs in two ways:
//  1. Obsolete blobs: The engine knows about blobs it no longer needs (e.g. after data is
//     removed or modified) and explicitly requests their deletion via Release events.
//  2. Orphan blobs: If an exception occurs mid-operation, blobs may be written to IndexedDB
//     without the manifest being updated, leaving blobs the engine doesn't know about.
//     Using Tracked events, we collect all blob names the engine considers active and delete
//     any remaining blobs in IndexedDB that aren't in that set.
//
// Search takes precedence: physical blob deletion would remove blobs an in-flight read still
// references, so if any read is in flight the whole task defers and re-enqueues itself.
export class CleanUpStaleBlobsTask extends BaseTask {
    getUid(): string {
        return this.getKind();
    }

    getKind(): IndexerTaskKind {
        return 'cleanup-stale-blobs-task';
    }

    async execute(ctx: TaskContext): Promise<void> {
        Logger.info(`Running: ${this.getUid()}`);

        const instances = [...ctx.indexRegistry.getAll()];

        // A search query is in progress, we should not be deleting blobs for now (the pending query might
        // have internal references to them).
        if (instances.some((instance) => instance.blobStore.hasActiveReads())) {
            Logger.info(`${this.getUid()}: deferring - a search/export read is in flight`);
            ctx.enqueueDelayed(new CleanUpStaleBlobsTask(), CLEANUP_DEFER_ON_ACTIVE_READ_MS);
            return;
        }

        for (const instance of instances) {
            try {
                await this.cleanUpInstance(instance, ctx);
            } catch (e) {
                if (isAbortError(e) || classifyError(e).kind === 'permanent') {
                    throw e;
                }
                // Non-critical: log and continue to the next engine.
                sendErrorReportForSearch(`CleanUpStaleBlobsTask: failed for engine <${instance.indexKind}>`, e, {
                    tags: { indexKind: instance.indexKind },
                });
            }
        }
    }

    private async cleanUpInstance(instance: IndexInstance, ctx: TaskContext): Promise<void> {
        const { engine, blobStore, indexKind } = instance;

        const cleanup = engineCall('cleanup: acquire', () => engine.cleanup());
        if (!cleanup) {
            const error = new Error(`CleanUpStaleBlobsTask: skipping engine <${indexKind}> (write lock busy)`);
            sendErrorReportForSearch(error.message, error);
            return;
        }

        let releasedCount = 0;
        let orphanCount = 0;
        // Release events below free blobs from the in-memory cache, and this loop drives a live
        // Cleanup execution - the same cross-step-reference hazard IndexReader/IndexWriter guard
        // against. Marking the store busy defers those frees until the execution is freed.
        blobStore.beginWrite();
        try {
            try {
                const result = await this.driveCleanupIterator(cleanup, blobStore);
                releasedCount = result.releasedCount;
                orphanCount = await this.deleteOrphanBlobs(indexKind, result.trackedBlobNames, ctx);
            } finally {
                // Swallowed rather than wrapped: raised from a `finally` a throwing free() would
                // mask whatever error is already in flight, which is the one worth diagnosing.
                try {
                    cleanup.free();
                } catch (e) {
                    sendErrorReportForSearch(
                        `CleanUpStaleBlobsTask: failed to free cleanup handle <${indexKind}>`,
                        maybeWrapAsSearchLibraryError('cleanup: free', e)
                    );
                }
            }
        } finally {
            // After cleanup.free(), and unskippable - see the same pattern in WriteSession.commit.
            blobStore.endWrite();
        }

        ctx.searchMetrics.markBlobsCleanup({ removedBlobsCount: releasedCount + orphanCount });
    }

    private async driveCleanupIterator(
        cleanup: Cleanup,
        blobStore: IndexBlobStore
    ): Promise<{ trackedBlobNames: Set<string>; releasedCount: number }> {
        const trackedBlobNames = new Set<string>();
        let releasedCount = 0;

        const nextEvent = () => engineCall('cleanup: next event', () => cleanup.next());

        for (let event = nextEvent(); event !== undefined; event = nextEvent()) {
            const current = event;
            switch (engineCall('cleanup: event kind', () => current.kind())) {
                case CleanupEventKind.Load:
                    await blobStore.loadEvent(current);
                    break;
                case CleanupEventKind.Save:
                    await blobStore.saveEvent(current);
                    break;
                case CleanupEventKind.Release:
                    // Clean-up obsolete blob
                    await blobStore.releaseEvent(current);
                    releasedCount++;
                    break;
                case CleanupEventKind.Tracked:
                    // Track active blobs (to allow deleting non-active/orphan ones later)
                    trackedBlobNames.add(engineCall('cleanup: event id', () => current.id()).toString());
                    break;
            }
        }

        return { trackedBlobNames, releasedCount };
    }

    private async deleteOrphanBlobs(
        indexKind: IndexKind,
        trackedBlobNames: Set<string>,
        ctx: TaskContext
    ): Promise<number> {
        const allKeys = await ctx.db.getAllIndexBlobKeys();

        let orphanCount = 0;
        for (const key of allKeys) {
            const [kind, blobName] = key;
            if (kind !== indexKind) {
                continue;
            }
            if (trackedBlobNames.has(blobName)) {
                continue;
            }
            Logger.info(`deleting blob ${blobName}`);
            await ctx.db.deleteIndexBlob(key);
            orphanCount++;
        }

        if (orphanCount > 0) {
            Logger.info(`${this.getUid()}: deleted ${orphanCount} orphan blob(s) for index "${indexKind}"`);
        }

        return orphanCount;
    }
}
