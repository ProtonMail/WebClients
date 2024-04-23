import { DependencyList, EffectCallback, useEffect, useRef, useState } from 'react';

import generateUID from '@proton/atoms/generateUID';

import useDebouncedCallback from './useDebouncedCallback';

function useDebounceEffect(effect: EffectCallback, deps?: DependencyList, wait = 500) {
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
            return effect();
        } else {
            isMounted.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flag]);
}

export default useDebounceEffect;
