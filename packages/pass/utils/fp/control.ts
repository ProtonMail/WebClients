/* eslint-disable-next-line lodash/import-scope */
import type { DebounceSettings } from 'lodash';
import debounce from 'lodash/debounce';

import type { Callback } from '@proton/pass/types';

/** Creates a debounced function that accumulates parameters
 * between calls. Params are collected in a buffer and processe
 * as a batch when the debounce period ends. Handles race conditions
 * by creating a snapshot of accumulated data before processing. */
export const debounceBuffer = <T, R>(
    effect: (acc: R[]) => void,
    accept: (params: T) => R | false,
    wait: number,
    { flushThreshold, ...options }: DebounceSettings & { flushThreshold?: number }
) => {
    const acc = new Set<R>();

    const debouncedFn = debounce(
        () => {
            const snapshot = Array.from(acc.values());
            acc.clear();
            if (snapshot.length > 0) effect(snapshot);
        },
        wait,
        options
    );

    const fn = (param: T) => {
        const res = accept(param);

        if (res !== false) acc.add(res);
        if (flushThreshold && acc.size >= flushThreshold) debouncedFn.flush();
        else debouncedFn();
    };

    fn.cancel = () => {
        acc.clear();
        debouncedFn.cancel();
    };

    fn.flush = debouncedFn.flush;

    return fn;
};

type SkipFirstFn<T extends Callback<any[], void>> = T & { reset: () => void };

export const skipFirst = <T extends Callback<any[], void>>(fn: T): SkipFirstFn<T> => {
    let called = false;

    const callback = ((...args: Parameters<T>) => {
        if (called) fn(...args);
        else called = true;
    }) as SkipFirstFn<T>;

    callback.reset = () => (called = false);

    return callback;
};
