import type { IndexedDBRow } from '../esIDB';

/**
 * Mutate progress ref to take into account newly indexed items and estimate new index time, and optionnally persist the progress state in the DB
 *
 * @param progress can be either a single number representing the count of indexed items OR a tuple composed of the count of indexed items and the total items to index
 */
export type RecordProgress = (
    progress: number | [number, number],
    indexedDbRow?: IndexedDBRow,
    userID?: string,
    isResumingIndexing?: boolean
) => Promise<void>;
