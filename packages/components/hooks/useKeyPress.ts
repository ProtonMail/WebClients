import type { DependencyList } from 'react';
import { useCallback, useEffect } from 'react';

const useKeyPress = (cb: (e: KeyboardEvent) => void, deps: DependencyList = [], el = document) => {
    const callback = useCallback(cb, deps);

    useEffect(() => {
        el.addEventListener('keydown', callback);
        return () => el.removeEventListener('keydown', callback);
    }, deps);
};

export default useKeyPress;
