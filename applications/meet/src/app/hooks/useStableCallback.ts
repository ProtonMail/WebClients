import { useCallback } from 'react';

import { useLatest } from './useLatest';

export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
    const fnRef = useLatest(fn);

    return useCallback((...args: Parameters<T>) => {
        return fnRef.current(...args);
    }, []) as T;
}
