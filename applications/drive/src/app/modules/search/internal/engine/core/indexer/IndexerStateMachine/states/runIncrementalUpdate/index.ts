import { Logger } from '../../../../../../Logger';

/**
 * INCREMENTAL_UPDATE: Fetch and apply all changes since the last checkpoint.
 *
 * Flow:
 * 1. Read the last checkpoint from BaseSyncCursor. A missing checkpoint is a
 *    terminal error — it should never happen outside of data tampering.
 * 2. Fetch all UpdateItems since that checkpoint via fetchUpdateItemsSince().
 * 3. Convert each UpdateItem into an IndexOperation via BaseIncrementalUpdater.
 * 4. Apply all operations to the pending index (add / update / remove entries).
 * 5. Commit, encrypt, and persist the updated blob to IndexedDB.
 * 6. Persist the new checkpoint via setCurrentCheckpoint().
 */
export const runIncrementalUpdate = async (): Promise<void> => {
    Logger.info('IndexerStateMachine: INCREMENTAL_UPDATE — starting');

    // TODO: Read last checkpoint and load event ids from here.
    // TODO: Commit the pending index via the search library writer.
    // TODO: set new checkpoint

    Logger.info('IndexerStateMachine: INCREMENTAL_UPDATE — done');
};
