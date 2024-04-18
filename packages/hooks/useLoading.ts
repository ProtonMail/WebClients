import { useCallback, useEffect, useRef, useState } from 'react';

import { SimpleMap } from '@proton/shared/lib/interfaces';
import isFunction from '@proton/utils/isFunction';

export type WithLoading = <T>(promise: undefined | Promise<T | void> | (() => Promise<T | void>)) => Promise<T | void>;
export type WithLoadingByKey = <T>(
    key: string,
    promise: undefined | Promise<T | void> | (() => Promise<T | void>)
) => Promise<T | void>;

function unwrapPromise<T>(maybeWrappedPromise: Promise<T | void> | (() => Promise<T | void>)): Promise<T | void> {
    if (isFunction(maybeWrappedPromise)) {
        return maybeWrappedPromise();
    }

    return maybeWrappedPromise;
}

export type LoadingByKey = SimpleMap<boolean>;

export const useLoadingByKey = (
    initialState: LoadingByKey = {}
): [LoadingByKey, WithLoadingByKey, (key: string, loading: boolean) => void] => {
    const [loading, setLoading] = useState<LoadingByKey>(initialState);
    const unmountedRef = useRef(false);
    const counterRefByKey = useRef<SimpleMap<number>>({});

    const getCurrentCounterRef = (key: string) => {
        return counterRefByKey.current[key] ?? 0;
    };

    const withLoading = useCallback<WithLoadingByKey>((key: string, maybeWrappedPromise) => {
        if (!maybeWrappedPromise) {
            setLoading((prev) => ({ ...prev, [key]: false }));
            return Promise.resolve();
        }

        const promise = unwrapPromise(maybeWrappedPromise);

        const counterNext = getCurrentCounterRef(key) + 1;
        counterRefByKey.current = { ...counterRefByKey.current, [key]: counterNext };

        setLoading((prev) => ({ ...prev, [key]: true }));

        return promise
            .then((result) => {
                // Ensure that the latest promise is setting the new state
                if (getCurrentCounterRef(key) !== counterNext) {
                    return;
                }

                if (!unmountedRef.current) {
                    setLoading((prev) => ({ ...prev, [key]: false }));
                }

                return result;
            })
            .catch((e) => {
                if (getCurrentCounterRef(key) !== counterNext) {
                    return;
                }

                if (!unmountedRef.current) {
                    setLoading((prev) => ({ ...prev, [key]: false }));
                }

                throw e;
            });
    }, []);

    const setManualLoading = (key: string, value: boolean) => {
        setLoading((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        unmountedRef.current = false;
        return () => {
            unmountedRef.current = true;
        };
    }, []);

    return [loading, withLoading, setManualLoading];
};

const SINGLE_LOADING_KEY = 'main';

const useLoading = (initialState = false): [boolean, WithLoading, (loading: boolean) => void] => {
    const [loadingByKey, withLoadingByKey, setLoadingByKey] = useLoadingByKey({ [SINGLE_LOADING_KEY]: initialState });

    const withLoading: WithLoading = useCallback(
        (args) => {
            return withLoadingByKey(SINGLE_LOADING_KEY, args);
        },
        [withLoadingByKey]
    );

    const setLoading = useCallback(
        (loading: boolean) => {
            return setLoadingByKey(SINGLE_LOADING_KEY, loading);
        },
        [setLoadingByKey]
    );

    return [loadingByKey[SINGLE_LOADING_KEY] as boolean, withLoading, setLoading];
};

export default useLoading;
