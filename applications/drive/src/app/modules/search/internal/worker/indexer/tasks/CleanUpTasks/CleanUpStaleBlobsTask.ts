import type { Cleanup } from '@proton/proton-foundation-search';
import { CleanupEventKind } from '@proton/proton-foundation-search';

import { Logger } from '../../../../shared/Logger';
import { sendErrorReportForSearch } from '../../../../shared/errors';
import type { IndexBlobStore } from '../../../index/IndexBlobStore';
import type { IndexInstance, IndexKind } from '../../../index/IndexRegistry';
import type { IndexerTaskKind, TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

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
export class CleanUpStaleBlobsTask extends BaseTask {
    getUid(): string {
        return this.getKind();
    }

    getKind(): IndexerTaskKind {
        return 'cleanup-stale-blobs-task';
    }

    async execute(ctx: TaskContext): Promise<void> {
        Logger.info(`Running: ${this.getUid()}`);
        for (const instance of ctx.indexRegistry.getAll()) {
            try {
                await this.cleanUpInstance(instance, ctx);
            } catch (e) {
                // Non-critical: log and continue to the next engine.
                sendErrorReportForSearch(`CleanUpStaleBlobsTask: failed for engine <${instance.indexKind}>`, e, {
                    tags: { indexKind: instance.indexKind },
                });
                continue;
            }
        }
    }

    private async cleanUpInstance(instance: IndexInstance, ctx: TaskContext): Promise<void> {
        const { engine, blobStore, indexKind } = instance;

        const cleanup = engine.cleanup();
        if (!cleanup) {
            const error = new Error(`CleanUpStaleBlobsTask: skipping engine <${indexKind}> (write lock busy)`);
            sendErrorReportForSearch(error.message, error);
            return;
        }

        let releasedCount = 0;
        let orphanCount = 0;
        try {
            const result = await this.driveCleanupIterator(cleanup, blobStore);
            releasedCount = result.releasedCount;
            orphanCount = await this.deleteOrphanBlobs(indexKind, result.trackedBlobNames, ctx);
        } finally {
            cleanup.free();
        }

        ctx.searchMetrics.markBlobsCleanup({ removedBlobsCount: releasedCount + orphanCount });
    }

    private async driveCleanupIterator(
        cleanup: Cleanup,
        blobStore: IndexBlobStore
    ): Promise<{ trackedBlobNames: Set<string>; releasedCount: number }> {
        const trackedBlobNames = new Set<string>();
        let releasedCount = 0;

        for (let event = cleanup.next(); event !== undefined; event = cleanup.next()) {
            switch (event.kind()) {
                case CleanupEventKind.Load:
                    await blobStore.loadEvent(event);
                    break;
                case CleanupEventKind.Save:
                    await blobStore.saveEvent(event);
                    break;
                case CleanupEventKind.Release:
                    // Clean-up obsolete blob
                    await blobStore.releaseEvent(event);
                    releasedCount++;
                    break;
                case CleanupEventKind.Tracked:
                    // Track active blobs (to allow deleting non-active/orphan ones later)
                    trackedBlobNames.add(event.id().toString());
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
