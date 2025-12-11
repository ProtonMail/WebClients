import type { AsyncCallback, MaybePromise } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export type UnwrapPromise<T> = T extends any[]
    ? { [K in keyof T]: UnwrapPromise<T[K]> }
    : T extends Promise<infer U>
      ? U
      : T;

export type Awaiter<T> = Promise<T> & { resolve: (value: T | PromiseLike<T>) => void; reject: (err: unknown) => void };
export type AsyncResult<F extends (...args: any[]) => Promise<any>> = Promise<Awaited<ReturnType<F>>>;

export const awaiter = <T>(options?: {
    onResolve?: (value: T | PromiseLike<T>) => void;
    onReject?: (err: unknown) => void;
}): Awaiter<T> => {
    let resolver: (value: T | PromiseLike<T>) => void = noop;
    let rejector: (err: unknown) => void = noop;

    const promise = new Promise<T>((resolve, reject) => {
        resolver = (value) => {
            resolve(value);
            options?.onResolve?.(value);
        };
        rejector = (err) => {
            reject(err);
            options?.onReject?.(err);
        };
    }) as Awaiter<T>;

    promise.resolve = resolver;
    promise.reject = rejector;

    return promise;
};

/**
 * this util will recursively unwrap promises in any
 * list like structure - it is useful in when working
 * with asynchronous & deeply nested data-structures.
 *
 * await unwrap([1,2,Promise.resolve(3)]) // [1,2,3]
 * await unwrap([1,2,[Promise.resolve(3)]) // [1,2,[3]]
 * await unwrap([[Promise.resolve(1)],[Promise.resolve(2)]]) // [[1],[2]]
 */
export const unwrap = async <T extends any[]>(arr: [...T]): Promise<UnwrapPromise<T>> =>
    Promise.all(arr.map((value) => (Array.isArray(value) ? unwrap(value) : value))) as Promise<UnwrapPromise<T>>;

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

type AsyncQueueOptions<F extends (...args: any[]) => Promise<any>> = AsyncLockOptions<F>;

export const asyncQueue = <F extends (...args: any[]) => Promise<any>>(fn: F, options?: AsyncQueueOptions<F>) => {
    const handlers = new Map<string, Promise<void>>();

    return (async (...args: Parameters<F>) => {
        const key = options?.key?.(...args) ?? '';
        const queue = handlers.get(key) ?? Promise.resolve();
        const job = awaiter<ReturnType<F>>();

        handlers.set(
            key,
            queue.then(async () => {
                try {
                    const result = await fn(...args);
                    job.resolve(result);
                } catch (err) {
                    job.reject(err);
                }
            })
        );

        return job;
    }) as F;
};

export type CancelablePromise<T> = Promise<T> & { cancel: () => void };

export const cancelable = <T>(job: () => Promise<T>, canceled: boolean = false) => ({
    run: () =>
        canceled
            ? Promise.reject()
            : new Promise<T>(async (resolve, reject) => {
                  const result = await job();
                  return canceled ? reject() : resolve(result);
              }),
    cancel: () => {
        canceled = true;
    },
});

/** Processes array items sequentially through an async function */
export const seq = async <T, R>(items: T[], job: (item: T) => MaybePromise<R>): Promise<R[]> => {
    const results: R[] = [];

    for (const item of items) {
        const result = await job(item);
        results.push(result);
    }

    return results;
};

export const abortable =
    (signal: AbortSignal) =>
    <T>(job: () => Promise<T>, onAbort?: () => void) => {
        if (signal.aborted) {
            onAbort?.();
            throw new DOMException('Aborted', 'AbortError');
        }

        return Promise.race([
            job(),
            new Promise((_, reject) =>
                signal.addEventListener(
                    'abort',
                    () => {
                        reject(new DOMException('Aborted', 'AbortError'));
                        onAbort?.();
                    },
                    { once: true }
                )
            ),
        ]) as Promise<T>;
    };

export const abortableSequence = async (operations: AsyncCallback[], signal: AbortSignal) => {
    async function* sequence() {
        for (const operation of operations) yield await abortable(signal)(operation);
    }

    const generator = sequence();
    while (!(await generator.next()).done) {}
};
