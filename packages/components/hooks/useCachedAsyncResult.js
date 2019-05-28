import { useCache } from 'react-components';
import { useEffect, useReducer } from 'react';
import { STATUS } from 'proton-shared/lib/models/cache';

/**
 * Shallowly compare the values of the dependency arrays
 * @param {Array} a
 * @param {Array} b
 * @return {boolean}
 */
const areDependenciesEqual = (a, b) => {
    if (!a) {
        return false;
    }
    for (let i = 0; i < a.length && i < b.length; i++) {
        if (a[i] === b[i]) {
            continue;
        }
        return false;
    }
    return true;
};

const getState = ({ value, status } = { status: STATUS.PENDING }) => {
    return [
        status === STATUS.PENDING || status === STATUS.RESOLVED ? value : undefined,
        status === STATUS.PENDING || status === STATUS.REJECTED
    ];
};

const reducer = (oldValue, record = { status: STATUS.PENDING }) => {
    if (record.status === STATUS.REJECTED) {
        /**
         * Throw an error if the promise is rejected.
         * 1) When it throws, the ErrorBoundary will be rendered
         * 2) When the component is re-rendered, the async fn will be retried
         */
        throw record.value;
    }
    const newValue = getState(record);
    if (areDependenciesEqual(oldValue, newValue)) {
        return oldValue;
    }
    return newValue;
};

/**
 * Caches an async result globally in the cache.
 * @param {String} key
 * @param {Function} miss - Returning a promise
 * @param {Array} dependencies - When to recall the function
 * @return {[value, loading]}
 */
const useCachedAsyncResult = (key, miss, dependencies) => {
    const cache = useCache();

    const [state, dispatch] = useReducer(reducer, undefined, () => {
        return getState(cache.get(key));
    });

    useEffect(() => {
        const cacheListener = (changedKey) => {
            if (changedKey !== key) {
                return;
            }
            dispatch(cache.get(key));
        };

        cacheListener(key);

        const unsubscribeCache = cache.subscribe(cacheListener);
        return () => {
            unsubscribeCache();
        };
    }, [cache]);

    useEffect(() => {
        const oldRecord = cache.get(key) || {};

        // Re-fetch if old result got rejected, or dependencies have changed
        if (oldRecord.status !== STATUS.REJECTED && areDependenciesEqual(oldRecord.dependencies, dependencies)) {
            return;
        }

        const promise = miss();

        const record = {
            status: STATUS.PENDING,
            value: oldRecord.value,
            promise,
            dependencies
        };

        cache.set(key, record);

        promise
            .then((value) => {
                return {
                    status: STATUS.RESOLVED,
                    value,
                    dependencies
                };
            })
            .catch((error) => {
                return {
                    status: STATUS.REJECTED,
                    value: error,
                    dependencies
                };
            })
            .then((record) => {
                const oldRecord = cache.get(key) || {};
                // Ensure it's the latest promise that is running
                if (oldRecord.promise !== promise) {
                    return;
                }
                cache.set(key, record);
            });
    }, [cache, ...dependencies]);

    return state;
};

export default useCachedAsyncResult;
