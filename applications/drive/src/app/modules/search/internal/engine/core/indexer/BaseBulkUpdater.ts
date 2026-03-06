import type { MainThreadBridge } from '../../../MainThreadBridge';
import type { IndexEntry } from './types';

/**
 * Implemented by engine configs to produce IndexEntries during the initial
 * bulk indexing pass — traversing all of the user's files at once.
 *
 * Used during the BULK_UPDATE state of the indexer state machine.
 */
export abstract class BaseBulkUpdater {
    abstract visitAndProduceIndexEntries(bridge: MainThreadBridge): AsyncIterableIterator<IndexEntry>;
}
