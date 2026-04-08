import { useCallback, useEffect, useRef } from 'react';

import { wait } from '@proton/shared/lib/helpers/promise';

export const maxPollingSteps = 5;
export const interval = 5000;

const helper = async (counter: number, cb: () => Promise<boolean>, signal?: AbortSignal) => {
    if (signal?.aborted) {
        return false;
    }
    if (counter <= 0) {
        return false;
    }
    const result = await cb();
    if (result) {
        return true;
    }
    if (signal?.aborted) {
        return false;
    }
    await wait(interval);
    return helper(counter - 1, cb, signal);
};

/**
 * After the Chargebee migration, certain objects aren't immediately updated.
 * For example, it takes a few seconds for updated Subscription object to appear.
 * This time isn't predictable due to async nature of the backend system, so we need to poll for the updated data.
 * */
export const usePollCondition = () => {
    const abortController = useRef<AbortController>();
    useEffect(() => {
        return () => {
            abortController.current?.abort();
        };
    }, []);
    return useCallback((cb: () => Promise<boolean>) => {
        abortController.current?.abort();
        abortController.current = new AbortController();
        return helper(maxPollingSteps, cb, abortController.current.signal);
    }, []);
};
