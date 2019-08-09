import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Given a promise, sets and resets loading when it's finished
 * @param {Boolean} initialState
 * @return {[]}
 */
const useLoading = (initialState = false) => {
    const [loading, setLoading] = useState(initialState);
    const unmountedRef = useRef(false);

    useEffect(() => {
        return () => (unmountedRef.current = true);
    }, []);

    const withLoading = useCallback((promise) => {
        if (!promise) {
            setLoading(false);
            return;
        }
        setLoading(true);
        return promise
            .then((result) => {
                !unmountedRef.current && setLoading(false);
                return result;
            })
            .catch((e) => {
                !unmountedRef.current && setLoading(false);
                throw e;
            });
    }, []);

    return [loading, withLoading];
};

export default useLoading;
