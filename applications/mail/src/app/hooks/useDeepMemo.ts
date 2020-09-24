import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { useRef, useMemo, DependencyList } from 'react';

/**
 * Special performance oriented useMemo which will store the previous value,
 * Compare deeply a new one to the previous and keep the reference if there is no changes
 */
export const useDeepMemo = <T>(factory: () => T, deps: DependencyList): T => {
    const previousValue = useRef<T>();

    return useMemo(() => {
        const newValue = factory();

        if (isDeepEqual(newValue, previousValue.current)) {
            return previousValue.current as T;
        } else {
            previousValue.current = newValue;
            return newValue;
        }
    }, deps);
};
