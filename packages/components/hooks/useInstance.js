import { useRef } from 'react';

/**
 * Use ref with callback support.
 * @param {function} fn
 * @returns {any}
 */
const useInstance = (fn) => {
    const ref = useRef();
    if (!ref.current) {
        ref.current = fn();
    }
    return ref.current;
};

export default useInstance;
