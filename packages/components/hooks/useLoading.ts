import { useRef, useState, useEffect, useCallback } from 'react';

type WithLoading = <T>(promise: undefined | Promise<T | void>) => Promise<T | void>;

const useLoading = (initialState = false): [boolean, WithLoading] => {
    const [loading, setLoading] = useState(initialState);
    const unmountedRef = useRef(false);
    const counterRef = useRef(0);

    useEffect(() => {
        return () => {
            unmountedRef.current = true;
        };
    }, []);

    const withLoading = useCallback<WithLoading>((promise) => {
        if (!promise) {
            setLoading(false);
            return Promise.resolve();
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
                if (!unmountedRef.current) {
                    setLoading(false);
                }
                return result;
            })
            .catch((e) => {
                if (counterRef.current !== counterNext) {
                    return;
                }
                if (!unmountedRef.current) {
                    setLoading(false);
                }
                throw e;
            });
    }, []);

    return [loading, withLoading];
};

export default useLoading;
