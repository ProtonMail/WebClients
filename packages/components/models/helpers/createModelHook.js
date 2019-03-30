import { useEffect, useCallback, useState, useRef } from 'react';
import { useApi, useCache, usePromiseCache } from 'react-components';

const PENDING = 1;
const RESOLVED = 2;
const REJECTED = 3;

const getStateToSync = (dataValue, promiseValue) => {
    const willInitialLoad = !dataValue && !promiseValue;

    const { value, status } = promiseValue || {};

    return [dataValue, status === PENDING || willInitialLoad, status === REJECTED ? value : undefined];
};

const mergeCache = (cache, value) => {
    cache.set({
        ...cache.get(),
        ...value
    });
};

/**
 * Creates an async fn model hook.
 * @return {function} the created hook
 */
const createUseModelHook = ({ key, get }) => {
    return () => {
        const promiseCache = usePromiseCache();
        const dataCache = useCache();
        const api = useApi();
        const dataValueRef = useRef();
        const promiseValueRef = useRef();

        const [state, setState] = useState(() => {
            const dataCacheState = dataCache.get();
            const promiseCacheState = promiseCache.get();

            const dataValue = dataCacheState[key];
            const promiseValue = promiseCacheState[key];

            return getStateToSync(dataValue, promiseValue);
        });

        const load = useCallback(async () => {
            const { status, value } = promiseCache.get()[key] || {};

            if (status === PENDING) {
                return value;
            }

            const promise = get(api);

            const getPromiseValue = (status, value) => {
                return {
                    [key]: {
                        status,
                        value
                    }
                };
            };

            mergeCache(promiseCache, getPromiseValue(PENDING, promise));

            promise
                .then((data) => {
                    mergeCache(promiseCache, getPromiseValue(RESOLVED, data));
                    mergeCache(dataCache, { [key]: data });
                })
                .catch((e) => {
                    mergeCache(promiseCache, getPromiseValue(REJECTED, e));
                });
        }, []);

        useEffect(() => {
            const cacheListener = () => {
                const dataValue = dataCache.get()[key];
                const promiseValue = promiseCache.get()[key];

                if (dataValueRef.current === dataValue && promiseValueRef.current === promiseValue) {
                    return;
                }

                setState(getStateToSync(dataValue, promiseValue));

                dataValueRef.current = dataValue;
                promiseValueRef.current = promiseValue;
            };

            const unsubscribeCache = dataCache.subscribe(cacheListener);
            const unsubscribePromiseCache = promiseCache.subscribe(cacheListener);

            const initialLoad = () => {
                const dataValue = dataCache.get()[key];
                const promiseValue = promiseCache.get()[key];

                dataValueRef.current = dataValue;
                promiseValueRef.current = promiseValue;

                // If data is not present in cache and not being fetched, load it
                if (!dataValue && !promiseValue) {
                    load();
                }
            };

            initialLoad();

            return () => {
                unsubscribeCache();
                unsubscribePromiseCache();
            };
        }, []);

        return [...state, load];
    };
};

export default createUseModelHook;
