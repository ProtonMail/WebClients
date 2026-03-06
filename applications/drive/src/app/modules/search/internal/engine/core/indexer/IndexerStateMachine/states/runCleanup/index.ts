import { Logger } from '../../../../../../Logger';

/**
 * CLEANUP: Release obsolete blobs from the search library.
 */
export const runCleanup = async (): Promise<void> => {
    Logger.info('IndexerStateMachine: CLEANUP — starting');

    // TODO: Call Writer.cleanup() from the @proton/proton-foundation-search library
    // to release obsolete index blobs. Await completion before continuing.

    // TODO: Delete any other config-scoped IndexedDB records
    // whose config key does not match the required config key.

    Logger.info('IndexerStateMachine: CLEANUP — done');
};
