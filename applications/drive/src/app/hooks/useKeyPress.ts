import { useEffect, useCallback } from 'react';

const useKeyPress = (cb: (e: KeyboardEvent) => void, deps: React.DependencyList = []) => {
    const callback = useCallback(cb, deps);

    useEffect(() => {
        document.addEventListener('keydown', callback);
        return () => {
            document.removeEventListener('keydown', cb);
        };
    }, deps);
};

export default useKeyPress;
