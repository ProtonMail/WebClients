import { DependencyList, useEffect, useCallback } from 'react';

const useKeyPress = (cb: (e: KeyboardEvent) => void, deps: DependencyList = [], el = document) => {
    const callback = useCallback(cb, deps);

    useEffect(() => {
        el.addEventListener('keydown', callback);
        return () => {
            el.removeEventListener('keydown', cb);
        };
    }, deps);
};

export default useKeyPress;
