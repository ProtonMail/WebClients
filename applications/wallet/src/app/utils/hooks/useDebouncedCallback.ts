import { useEffect, useMemo } from 'react';

import { debounce } from 'lodash';

import useLatest from './useLatest';

function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, wait = 500) {
    const fnRef = useLatest(fn);

    const debounced = useMemo(
        () =>
            debounce((...args: Parameters<T>): ReturnType<T> => {
                return fnRef.current(...args);
            }, wait),
        [fnRef, wait]
    );

    useEffect(() => {
        return () => {
            debounced.cancel();
        };
    }, []);

    return debounced;
}

export default useDebouncedCallback;
