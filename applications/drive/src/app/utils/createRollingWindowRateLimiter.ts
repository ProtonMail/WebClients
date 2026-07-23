export type RateLimiter = {
    /** Resolves once a request slot is available, respecting both quota and pause state. */
    acquire(): Promise<void>;
    /** Stop granting new requests until resume() is called. Requests already granted are unaffected. */
    pause(): void;
    /** Resume granting requests, immediately releasing any queued waiters that now fit under quota. */
    resume(): void;
    /** Current quota usage, for observability. */
    getUsage(): { used: number; max: number };
};

/**
 * Rolling-window request quota: at most `maxRequests` grants within any `intervalMs` window.
 * Unlike a concurrency semaphore, a grant doesn't need to be released - it simply ages out of
 * the window over time.
 */
export function createRollingWindowRateLimiter(maxRequests: number, intervalMs: number): RateLimiter {
    const grantedAt: number[] = [];
    const waiting: (() => void)[] = [];
    let paused = false;
    let wakeTimeout: ReturnType<typeof setTimeout> | null = null;

    function pruneExpired(now: number): void {
        while (grantedAt.length > 0 && now - grantedAt[0] >= intervalMs) {
            grantedAt.shift();
        }
    }

    function clearWake(): void {
        if (wakeTimeout) {
            clearTimeout(wakeTimeout);
            wakeTimeout = null;
        }
    }

    function scheduleWake(): void {
        clearWake();
        if (paused || waiting.length === 0 || grantedAt.length === 0) {
            return;
        }
        const waitMs = Math.max(0, intervalMs - (Date.now() - grantedAt[0]));
        wakeTimeout = setTimeout(drainWaiting, waitMs);
    }

    function drainWaiting(): void {
        if (paused) {
            return;
        }
        const now = Date.now();
        pruneExpired(now);
        while (waiting.length > 0 && grantedAt.length < maxRequests) {
            grantedAt.push(now);
            waiting.shift()?.();
        }
        scheduleWake();
    }

    return {
        acquire(): Promise<void> {
            const now = Date.now();
            if (!paused) {
                pruneExpired(now);
                if (grantedAt.length < maxRequests) {
                    grantedAt.push(now);
                    return Promise.resolve();
                }
            }
            return new Promise<void>((resolve) => {
                waiting.push(resolve);
                scheduleWake();
            });
        },
        pause(): void {
            paused = true;
            clearWake();
        },
        resume(): void {
            paused = false;
            drainWaiting();
        },
        getUsage(): { used: number; max: number } {
            pruneExpired(Date.now());
            return {
                used: grantedAt.length,
                max: maxRequests,
            };
        },
    };
}
