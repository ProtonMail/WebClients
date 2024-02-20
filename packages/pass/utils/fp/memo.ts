import type { AsyncCallback, Callback } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import lastItem from '@proton/utils/lastItem';

export type MaxAgeMemoizeOptions = { maxAge: number };

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
    }) as F extends Callback ? (...args: [...Parameters<F>, options: MaxAgeMemoizeOptions]) => ReturnType<F> : never;
};
