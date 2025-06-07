import type { Callback, Maybe } from '@proton/pass/types';

export type MaxAgeMemoCacheEntry<F extends Callback> = { validUntil: number; result: ReturnType<F> };
export type MaxAgeMemoizedFn<F extends Callback> = F & { flush: F };

export interface MaxAgeMemoCache<K, F extends Callback> {
    key: (...args: Parameters<F>) => K;
    get: (key: K) => Maybe<MaxAgeMemoCacheEntry<F>>;
    set: (key: K, value: MaxAgeMemoCacheEntry<F>) => void;
    delete: (key: K) => void;
}

export type MaxAgeMemoizeOptions<F extends Callback, K> = {
    /** maxAge in milliseconds */
    maxAge: number;
    /** custom implementation for the underlying cache. If
     * omitted will use an args cache which will serialize
     * arguments passed to the wrapped function */
    cache?: MaxAgeMemoCache<K, F>;
};

/** Creates a cache that serializes function arguments to JSON strings.
 * Use this when function arguments are serializable primitives/objects */
export const createSerializedArgsCache = <F extends Callback>(): MaxAgeMemoCache<string, F> => {
    const cache: Map<string, MaxAgeMemoCacheEntry<F>> = new Map();

    return {
        key: (...args) => JSON.stringify(args),
        get: cache.get.bind(cache),
        set: cache.set.bind(cache),
        delete: cache.delete.bind(cache),
    };
};

/** Creates a cache that uses object references as WeakMap keys.
 * Use this when you can derive a WeakKey from function arguments. */
export const createWeakRefCache = <F extends Callback, K extends WeakKey>(
    key: (...args: Parameters<F>) => K
): MaxAgeMemoCache<K, F> => {
    const cache: WeakMap<K, MaxAgeMemoCacheEntry<F>> = new WeakMap();

    return {
        key,
        get: cache.get.bind(cache),
        set: cache.set.bind(cache),
        delete: cache.delete.bind(cache),
    };
};

/** Memoizes the result of an asynchronous function with a specified maximum age.
 * Returns a wrapped function that accepts a trailing `maxAge` parameter in seconds */
export const maxAgeMemoize = <F extends Callback, K>(fn: F, options: MaxAgeMemoizeOptions<F, K>) => {
    const cache = (options.cache ?? createSerializedArgsCache()) as MaxAgeMemoCache<K, F>;

    const withMaxAge = (immediate?: boolean) =>
        ((...args: Parameters<F>) => {
            const now = new Date().getTime();
            const key = cache.key(...args);

            let cached = cache.get(key);

            if (cached?.validUntil && now >= cached.validUntil) {
                cache.delete(key);
                cached = undefined;
            }

            if (!immediate && cached) return cached.result;
            else {
                const result = fn(...args);
                if (result instanceof Promise) result.catch(() => cache.delete(key));
                cache.set(key, { validUntil: now + options.maxAge, result });
                return result;
            }
        }) as F;

    const memoized = withMaxAge() as MaxAgeMemoizedFn<F>;
    memoized.flush = withMaxAge(true);

    return memoized;
};

type DynamicMemo<T> = T & {
    /** Clears the cached results */
    clear: () => void;
    /** Toggles memoisation */
    memo: boolean;
};

export const dynMemo = <Arg extends string | number | symbol | object, Res>(
    fn: (first: Arg) => Res
): DynamicMemo<(arg: Arg) => Res> => {
    const cache = new Map<Arg, Res>();
    let memo = true;

    const memoized = ((arg: Arg): Res => {
        if (!memo) return fn(arg);

        const cached = cache.get(arg);
        if (cached !== undefined) return cached;

        const result = fn(arg);
        cache.set(arg, result);
        return result;
    }) as DynamicMemo<(arg: Arg) => Res>;

    return Object.defineProperties(memoized, {
        clear: { value: () => cache.clear() },
        memo: {
            get: () => memo,
            set: (enabled: boolean) => {
                if (!enabled) memoized.clear();
                memo = enabled;
            },
        },
    });
};
