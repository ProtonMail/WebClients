import { useEffect, useReducer, useCallback } from 'react';
import { useCache } from 'react-components';
import { STATUS } from 'proton-shared/lib/models/cache';

const getState = ({ value, status } = { status: STATUS.PENDING }) => {
    return [
        status === STATUS.PENDING || status === STATUS.RESOLVED ? value : undefined,
        status === STATUS.PENDING || status === STATUS.REJECTED,
        status === STATUS.REJECTED ? value : undefined
    ];
};

const reducer = (oldValue, record = { status: STATUS.PENDING }) => {
    const newValue = getState(record);
    if (newValue.every((value, i) => value === oldValue[i])) {
        return oldValue;
    }
    return newValue;
};

/**
 * Caches a model globally in the cache. Can be updated from the event manager.
 * @param {String} key
 * @param {Function} miss - Returning a promise
 * @return {[value, loading, error]}
 */
const useCachedModelResult = (key, miss) => {
    const cache = useCache();

    const [state, dispatch] = useReducer(reducer, undefined, () => {
        return getState(cache.get(key));
    });

    const refresh = useCallback(() => {
        const promise = miss();

        const record = {
            status: STATUS.PENDING,
            value: undefined,
            promise
        };

        cache.set(key, record);

        promise
            .then((value) => {
                return {
                    status: STATUS.RESOLVED,
                    value
                };
            })
            .catch((error) => {
                return {
                    status: STATUS.REJECTED,
                    value: error
                };
            })
            .then((record) => {
                const oldRecord = cache.get(key);
                // Ensure it's the latest promise that is running
                if (oldRecord && oldRecord.promise !== promise) {
                    return;
                }
                cache.set(key, record);
            });
    }, []);

    useEffect(() => {
        const cacheListener = (changedKey, record) => {
            if (changedKey !== key) {
                return;
            }

            // Handle case where it gets deleted from cache
            if (!record) {
                refresh();
                return;
            }

            dispatch(record);
        };

        const unsubscribeCache = cache.subscribe(cacheListener);

        /*
         * Updates should only happen if it's the first time or it's been rejected.
         * Otherwise updates will come from the event manager.
         */
        const oldRecord = cache.get(key);
        if (!oldRecord || oldRecord.status === STATUS.REJECTED) {
            refresh();
        }

        return () => {
            unsubscribeCache();
        };
    }, []);
    return state;
};

export default useCachedModelResult;
