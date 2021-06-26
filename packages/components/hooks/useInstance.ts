import { useRef } from 'react';

/**
 * Use ref with callback support.
 */
const useInstance = <T>(fn: () => T): T => {
    const ref = useRef<T>();
    if (!ref.current) {
        ref.current = fn();
    }
    return ref.current;
};

export default useInstance;
