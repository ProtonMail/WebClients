export type ConcurrencyLimiter = {
    /**
     * Runs `task` once a slot is free, releasing the slot when it settles (even on error).
     */
    run<T>(task: () => Promise<T>): Promise<T>;
};

/**
 * Limits how many async tasks run concurrently to `maxConcurrency`. Slots are transferred
 * directly to the next waiter on release, so the active count only drops when nobody is waiting.
 */
export function createConcurrencyLimiter(maxConcurrency: number): ConcurrencyLimiter {
    let active = 0;
    const waiting: (() => void)[] = [];

    const acquire = (): Promise<void> => {
        if (active < maxConcurrency) {
            active++;
            return Promise.resolve();
        }
        return new Promise<void>((resolve) => waiting.push(resolve));
    };

    const release = () => {
        const next = waiting.shift();
        if (next) {
            next();
        } else {
            active--;
        }
    };

    return {
        async run(task) {
            await acquire();
            try {
                return await task();
            } finally {
                release();
            }
        },
    };
}
