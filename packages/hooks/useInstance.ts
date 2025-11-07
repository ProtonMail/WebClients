import { useRef } from 'react';

/**
 * Use ref with callback support.
 */
const useInstance = <T>(fn: () => T): T => {
    const ref = useRef<T | null>(null);
    if (!ref.current) {
        ref.current = fn();
    }
    return ref.current as T;
};

export default useInstance;
