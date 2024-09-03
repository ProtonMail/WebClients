import type { DependencyList, EffectCallback } from 'react';
import { useEffect, useRef, useState } from 'react';

import generateUID from '@proton/utils/generateUID';

import useDebouncedCallback from './useDebouncedCallback';

export const useDebounceEffect = (effect: EffectCallback, deps?: DependencyList, wait = 500) => {
    const isMounted = useRef(false);
    const [flag, setFlag] = useState({});

    const debounced = useDebouncedCallback(() => {
        setFlag(generateUID('debounced-effect'));
    }, wait);

    useEffect(() => {
        return debounced();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        if (isMounted.current) {
            const cleanup = effect();

            return () => {
                debounced.cancel();
                return cleanup?.();
            };
        } else {
            isMounted.current = true;
            return () => {
                debounced.cancel();
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flag]);
};
