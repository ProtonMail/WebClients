import noop from '@proton/utils/noop';

export type UnwrapPromise<T> = T extends any[]
    ? { [K in keyof T]: UnwrapPromise<T[K]> }
    : T extends Promise<infer U>
      ? U
      : T;

export type Awaiter<T> = Promise<T> & { resolve: (value: T | PromiseLike<T>) => void };
export type AsyncResult<F extends (...args: any[]) => Promise<any>> = Promise<Awaited<ReturnType<F>>>;

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

export const awaiter = <T>(): Awaiter<T> => {
    let resolver: (value: T | PromiseLike<T>) => void = noop;

    const promise = new Promise<T>((resolve) => (resolver = resolve)) as Awaiter<T>;
    promise.resolve = resolver;

    return promise;
};

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
