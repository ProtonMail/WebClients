import { Logger } from '../../../../../../Logger';
import type { MainThreadBridge } from '../../../../../../MainThreadBridge';
import type { IndexerContext } from '../../types';

/**
 * BULK_UPDATE: Build the search index from scratch.
 *
 * Iterates all files via the BulkUpdater, inserts each entry into the search
 * library write session, then commits and persists the resulting blobs to
 * IndexedDB. On success, updates the DB engine state to reflect the active config.
 */
export const runBulkUpdate = async (
    ctx: IndexerContext,
    bridge: MainThreadBridge,
    signal: AbortSignal
): Promise<void> => {
    Logger.info('IndexerStateMachine: BULK_UPDATE — starting');

    // TODO: Call syncCursor.setCurrentCheckpoint() here, before iterating,
    // to mark the point-in-time from which incremental updates will resume.
    // This ensures no events are missed between the bulk update and the first
    // incremental update.

    const bulkUpdater = new ctx.config.BulkUpdater();
    const session = ctx.indexWriter.startWriteSession();
    let processedCount = 0;

    try {
        for await (const entry of bulkUpdater.visitAndProduceIndexEntries(bridge)) {
            if (signal.aborted) {
                Logger.info('IndexerStateMachine: BULK_UPDATE — aborted');
                throw new DOMException('Aborted', 'AbortError');
            }

            session.insert(entry);
            processedCount++;

            if (processedCount % 100 === 0) {
                Logger.debug(`IndexerStateMachine: BULK_UPDATE — ${processedCount} entries processed`);
            }
        }

        if (signal.aborted) {
            Logger.info('IndexerStateMachine: BULK_UPDATE — aborted before commit');
            throw new DOMException('Aborted', 'AbortError');
        }

        await session.commit();
    } finally {
        session.dispose();
    }

    Logger.info(`IndexerStateMachine: BULK_UPDATE — completed (${processedCount} entries)`);

    // TODO: Classify and handle all errors — report to Sentry/Grafana and surface to the user where appropriate.
    await ctx.db.setEngineState({ activeConfigKey: ctx.requiredConfigKey });
};
