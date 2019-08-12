import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Given a promise, sets and resets loading when it's finished
 * @param {Boolean} initialState
 * @return {[]}
 */
const useLoading = (initialState = false) => {
    const [loading, setLoading] = useState(initialState);
    const unmountedRef = useRef(false);
    const counterRef = useRef(0);

    useEffect(() => {
        return () => (unmountedRef.current = true);
    }, []);

    const withLoading = useCallback((promise) => {
        if (!promise) {
            setLoading(false);
            return;
        }
        const counterNext = counterRef.current + 1;
        counterRef.current = counterNext;
        setLoading(true);
        return promise
            .then((result) => {
                // Ensure that the latest promise is setting the new state
                if (counterRef.current !== counterNext) {
                    return;
                }
                !unmountedRef.current && setLoading(false);
                return result;
            })
            .catch((e) => {
                if (counterRef.current !== counterNext) {
                    return;
                }
                !unmountedRef.current && setLoading(false);
                throw e;
            });
    }, []);

    return [loading, withLoading];
};

export default useLoading;
