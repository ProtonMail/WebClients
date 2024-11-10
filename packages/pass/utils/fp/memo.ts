import type { AsyncCallback } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import lastItem from '@proton/utils/lastItem';

type MaxAgeMemoizeOptions = { maxAge: number };

export type MaxAgeMemoizedFn<F extends AsyncCallback> = (
    ...args: [...Parameters<F>, options: MaxAgeMemoizeOptions]
) => ReturnType<F>;

/** Memoizes the result of an asynchronous function with a specified maximum age.
 * Returns a wrapped function that accepts a trailing `maxAge` parameter in seconds */
export const maxAgeMemoize = <F extends AsyncCallback>(fn: F) => {
    const cache: Map<string, { calledAt: number; result: ReturnType<F> }> = new Map();

    return (async (...args: [...Parameters<F>, options: MaxAgeMemoizeOptions]) => {
        const calledAt = getEpoch();
        const { maxAge } = lastItem(args) as MaxAgeMemoizeOptions;

        const memoArgs = JSON.stringify(args.slice(0, -1));
        const cached = cache.get(memoArgs);

        if (cached && calledAt - cached.calledAt < maxAge) return cached.result;
        else {
            const result = await fn(...args);
            cache.set(memoArgs, { calledAt, result });
            return result;
        }
    }) as MaxAgeMemoizedFn<F>;
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
