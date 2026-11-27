/**
 * The searches open in the tabs of a user, which the leader's index worker matches the messages it writes against.
 * How a tab lists its searches so the leader sees them depends on what the browser has, see `createTabCoordination`.
 */
export interface OpenSearchDirectory {
    /**
     * Lists a search until the returned close is called, or the tab goes away. Resolves once the leader can see it, so
     * a search that waits for it before running misses no write. `onMissedUpdates` is called when the leader may have
     * stopped seeing the search for a while, after which its results may be stale and it has to run again.
     */
    open(searchId: string, expression: string, onMissedUpdates: () => void): Promise<() => void>;
    /** Every tab's open searches: their expression by search id. */
    list(): Promise<ReadonlyMap<string, string>>;
}
