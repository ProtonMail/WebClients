/**
 * In-memory LockManager fake for jsdom, which does not implement the Web Locks API.
 * Grants a lock immediately if free; otherwise queues the request until the holder releases it.
 * Exclusive-mode only - enough for this codebase's usage (mutual exclusion around the search engine).
 */
export class FakeLockManager implements Pick<LockManager, 'request'> {
    private heldNames = new Set<string>();
    private queues = new Map<string, (() => void)[]>();

    async request<T>(
        name: string,
        callbackOrOptions: LockGrantedCallback<T> | LockOptions,
        maybeCallback?: LockGrantedCallback<T>
    ): Promise<Awaited<T>> {
        const callback = typeof callbackOrOptions === 'function' ? callbackOrOptions : maybeCallback;
        if (!callback) {
            throw new Error('FakeLockManager: request() called without a callback');
        }
        await this.acquire(name);
        try {
            return await callback(null);
        } finally {
            this.release(name);
        }
    }

    private acquire(name: string): Promise<void> {
        if (!this.heldNames.has(name)) {
            this.heldNames.add(name);
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            const queue = this.queues.get(name) ?? [];
            queue.push(resolve);
            this.queues.set(name, queue);
        });
    }

    private release(name: string) {
        const queue = this.queues.get(name);
        const next = queue?.shift();
        if (next) {
            next();
        } else {
            this.heldNames.delete(name);
        }
    }

    /**
     * Drops every held lock and pending waiter. Production releases a lock from
     * `disposeInternals()`, which tests only reach fire-and-forget via `disconnectClient()` - so a
     * test typically ends while still holding its lock, and the next one would block on it forever.
     */
    reset() {
        this.heldNames.clear();
        this.queues.clear();
    }
}
