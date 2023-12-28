import type { Callback, MaybeNull } from '@proton/pass/types';

import { getEpoch } from '../time/get-epoch';

type WithCallCount<F extends Callback> = F & {
    /** Number of function calls since last `resetCount` call */
    callCount: number;
    /** Epoch in seconds of the last function call */
    lastCalledAt: MaybeNull<number>;
    /** Resets the internal call count */
    resetCount: () => void;
};

export const withCallCount = <F extends Callback>(fn: F): WithCallCount<F> => {
    const wrappedFn = ((...args) => {
        wrappedFn.lastCalledAt = getEpoch();
        wrappedFn.callCount += 1;
        return fn(...args);
    }) as WithCallCount<F>;

    wrappedFn.callCount = 0;
    wrappedFn.lastCalledAt = null;
    wrappedFn.resetCount = () => (wrappedFn.callCount = 0);

    return wrappedFn;
};
