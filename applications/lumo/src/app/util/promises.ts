// Copied from packages/pass/utils/fp/promises.ts
// Detached here to avoid linking to packages/pass

export type AsyncResult<F extends (...args: any[]) => Promise<any>> = Promise<Awaited<ReturnType<F>>>;

/** Defines options for asynchronous function locking to manage concurrent executions */
type AsyncLockOptions<F extends (...args: any[]) => Promise<any>> = {
    /** Optionally defines a key generator function to determine the lock key based on
     * function parameters. This allows locking multiple function calls depending on
     * parameters. If omitted, all function calls will be locked uniformly. */
    key?: (...args: Parameters<F>) => string;
};

/** Creates a function that locks the execution of an asynchronous function to manage concurrency */
export const asyncLock = <F extends (...args: any[]) => Promise<any>>(fn: F, options?: AsyncLockOptions<F>) => {
    const handlers = new Map<string, AsyncResult<F>>();

    return (...args: Parameters<F>): AsyncResult<F> => {
        const key = options?.key?.(...args) ?? '';
        const pending = handlers.get(key) ?? fn(...args).finally(() => handlers.delete(key));
        handlers.set(key, pending);

        return pending;
    };
};

/** Yields promise results as they complete, maintaining the order of completion rather than submission */
export async function* racePromises<T>(promises: Promise<T>[]): AsyncGenerator<T> {
    const pending = new Set(promises);
    while (pending.size > 0) {
        const { value, promise } = await Promise.race(
            Array.from(pending).map(async (promise) => ({ value: await promise, promise }))
        );
        pending.delete(promise);
        yield value;
    }
}
