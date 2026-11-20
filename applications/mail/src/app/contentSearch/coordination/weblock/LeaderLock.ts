import type { LeaderLock as LeaderLockInterface } from '../LeaderLock';

/** A request for the lock, from `acquire()` until `release()`. */
interface LeaderRequest {
    acquired: Promise<boolean>;
    release: () => void;
}

/**
 * {@link LeaderLockInterface} on the Web Lock `content-search:<userId>:leader`. A tab that closes or crashes releases it with
 * everything else it held, so it's never lost while the tab lives, and `onLost` never fires.
 */
export class LeaderLock implements LeaderLockInterface {
    private readonly lockName: string;
    private request: LeaderRequest | undefined;

    constructor(
        userId: string,
        // eslint-disable-next-line compat/compat -- content search requires Safari 15.4+
        private readonly locks: LockManager = navigator.locks
    ) {
        this.lockName = `content-search:${userId}:leader`;
    }

    acquire(): Promise<boolean> {
        if (!this.request) {
            this.request = this.requestLock();
        }
        return this.request.acquired;
    }

    private requestLock(): LeaderRequest {
        const abortController = new AbortController();
        let release!: () => void;
        const released = new Promise<void>((resolve) => {
            release = resolve;
        });
        const acquired = new Promise<boolean>((resolve) => {
            this.locks
                .request(this.lockName, { signal: abortController.signal }, () => {
                    resolve(true);
                    return released;
                })
                .catch(() => {
                    // released before it was acquired
                    resolve(false);
                });
        });
        return {
            acquired,
            release: () => {
                abortController.abort();
                release();
            },
        };
    }

    release(): void {
        this.request?.release();
        this.request = undefined;
    }

    onLost(_listener: () => void): () => void {
        return () => {};
    }
}
