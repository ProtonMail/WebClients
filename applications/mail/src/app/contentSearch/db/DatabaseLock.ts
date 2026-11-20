/** Synchronizes access for search and indexing to the foundation-search blob storage.
 * this is needed because interleaved access would read blobs outside a single revision
 * and cause foundation-search to fail because of inconsistent data in the blobs.
 * Search operations can interrupt indexing operations, as they are higher priority
 * for the user. If indexing is interrupted by search, it will be automatically
 * retried by running the runIndexing callback again */
export interface DatabaseLock {
    /** runs once indexing has unwound, searches run one after the other */
    runSearch(callback: () => Promise<void>): Promise<void>;
    /** can be interrupted by search so might run several times before it can complete */
    runIndexing(callback: (signal: AbortSignal) => Promise<void>): Promise<void>;
}
