import { useEffect, useMemo } from 'react';

import debounce from 'lodash/debounce';

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return debounced;
}

export default useDebouncedCallback;
