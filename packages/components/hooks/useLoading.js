import { useState, useCallback } from 'react';

/**
 * Given a promise, sets and resets loading when it's finished
 * @param {Boolean} initialState
 * @return {[]}
 */
const useLoading = (initialState = false) => {
    const [loading, setLoading] = useState(initialState);

    const withLoading = useCallback((promise) => {
        if (!promise) {
            setLoading(false);
            return;
        }
        setLoading(true);
        return promise
            .then(() => setLoading(false))
            .catch((e) => {
                setLoading(false);
                throw e;
            });
    }, []);

    return [loading, withLoading];
};

export default useLoading;
