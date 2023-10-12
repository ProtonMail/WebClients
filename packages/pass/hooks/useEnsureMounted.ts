import { useCallback } from 'react';

import useIsMounted from '@proton/hooks/useIsMounted';
import type { Callback, Maybe } from '@proton/pass/types';

export const useEnsureMounted = () => {
    const isMounted = useIsMounted();
    return useCallback(
        <T extends Callback>(fn: T) =>
            ((...args: Parameters<T>): Maybe<ReturnType<T>> => {
                if (isMounted()) return fn(...args);
            }) as T,
        []
    );
};
