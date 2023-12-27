import type { Callback } from '@proton/pass/types';

type WithCallCount<F extends Callback> = F & { callCount: number; resetCount: () => void };

export const withCallCount = <F extends Callback>(fn: F): WithCallCount<F> => {
    const wrappedFn = ((...args) => {
        wrappedFn.callCount += 1;
        return fn(...args);
    }) as WithCallCount<F>;

    wrappedFn.callCount = 0;
    wrappedFn.resetCount = () => (wrappedFn.callCount = 0);

    return wrappedFn;
};
