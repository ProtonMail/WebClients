import type { DependencyList } from 'react';
import { useMemo, useRef } from 'react';

import isDeepEqual from 'lodash/isEqual';

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
        }

        previousValue.current = newValue;
        return newValue;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-65D9D1
    }, deps);
};
