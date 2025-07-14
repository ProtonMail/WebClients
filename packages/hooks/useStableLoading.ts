import { useEffect, useState } from 'react';

import isFunction from '@proton/utils/isFunction';

export const DEFAULT_DELAY = 300;

/**
 * Hook to prevent loading state flickering by debouncing the transition to non-loading state.
 * - Immediately sets loading=true when the condition becomes true
 * - Delays setting loading=false to prevent brief flickers
 *
 * @param loadingCondition - Either an array of boolean states, a single boolean, or a predicate function
 * @param options - Configuration options
 * @returns Stabilized loading state
 */
const useStableLoading = (
    loadingCondition: boolean[] | boolean | (() => boolean),
    { delay = DEFAULT_DELAY, initialState = true } = {}
): boolean => {
    const [stableLoading, setStableLoading] = useState(initialState);

    useEffect(() => {
        const isCurrentlyLoading = (() => {
            if (isFunction(loadingCondition)) {
                return loadingCondition();
            } else if (Array.isArray(loadingCondition)) {
                return loadingCondition.some(Boolean);
            } else {
                return !!loadingCondition;
            }
        })();

        if (isCurrentlyLoading) {
            setStableLoading(true);
        } else {
            const timer = setTimeout(() => {
                setStableLoading(false);
            }, delay);

            return () => clearTimeout(timer);
        }
    }, [loadingCondition, delay]);

    return stableLoading;
};

export default useStableLoading;
