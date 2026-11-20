/** Held by at most one tab of a user at a time: the leader. */
export interface LeaderLock {
    /** resolves with true once held, or with false when released before that */
    acquire(): Promise<boolean>;
    /** gives up the lock, or the place in the queue for it */
    release(): void;
    /** called when the lock is lost without `release()`. Returns the unsubscribe function */
    onLost(listener: () => void): () => void;
}
