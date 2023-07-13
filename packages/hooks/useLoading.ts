import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import isFunction from '@proton/utils/isFunction';

export type WithLoading = <T>(promise: undefined | Promise<T | void> | (() => Promise<T | void>)) => Promise<T | void>;

function unwrapPromise<T>(maybeWrappedPromise: Promise<T | void> | (() => Promise<T | void>)): Promise<T | void> {
    if (isFunction(maybeWrappedPromise)) {
        return maybeWrappedPromise();
    }

    return maybeWrappedPromise;
}

const useLoading = (initialState = false): [boolean, WithLoading, Dispatch<SetStateAction<boolean>>] => {
    const [loading, setLoading] = useState(initialState);
    const unmountedRef = useRef(false);
    const counterRef = useRef(0);

    useEffect(() => {
        unmountedRef.current = false;
        return () => {
            unmountedRef.current = true;
        };
    }, []);

    const withLoading = useCallback<WithLoading>((maybeWrappedPromise) => {
        if (!maybeWrappedPromise) {
            setLoading(false);
            return Promise.resolve();
        }
        const promise = unwrapPromise(maybeWrappedPromise);
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

    return [loading, withLoading, setLoading];
};

export default useLoading;
