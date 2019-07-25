import { useEffect, useReducer, useRef } from 'react';
import { STATUS } from 'proton-shared/lib/models/cache';

export const getState = ({ value, status } = { status: STATUS.PENDING }) => {
    return [
        status === STATUS.PENDING || status === STATUS.RESOLVED ? value : undefined,
        status === STATUS.PENDING,
        status === STATUS.REJECTED ? value : undefined
    ];
};

export const reducer = (oldValue, record = { status: STATUS.PENDING }) => {
    const newValue = getState(record);
    if (newValue.every((value, i) => value === oldValue[i])) {
        return oldValue;
    }
    return newValue;
};

const getRecordPending = (promise) => {
    return {
        status: STATUS.PENDING,
        value: undefined,
        promise
    };
};

const getRecordThen = (promise) => {
    return promise
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
        });
};

/**
 * The strategy to re-fetch is:
 * 1) When no record exists for that key.
 * 2) If the old record has failed to fetch.
 * This should only happen when:
 * 1) When the component is initially mounted.
 * 2) A mounted component that receives an update from the cache that the key has been removed.
 * 3) A mounted component receives an update that the key has changed.
 * @param {Object} cache
 * @param {Object} key
 * @param {Function} miss
 * @return {Object}
 */
const update = (cache, key, miss) => {
    const oldRecord = cache.get(key);
    if (!oldRecord || oldRecord.status === STATUS.REJECTED) {
        const promise = miss();
        const record = getRecordPending(promise);
        cache.set(key, record);
        getRecordThen(promise).then((newRecord) => cache.get(key) === record && cache.set(key, newRecord));
        return record;
    }
    return oldRecord;
};

/**
 * Caches a model globally in the cache. Can be updated from the event manager.
 * @param {Map} cache
 * @param {String} key
 * @param {Function} miss - Returning a promise
 * @return {[value, loading, error]}
 */
const useCachedModelResult = (cache, key, miss) => {
    const [state, dispatch] = useReducer(reducer, undefined, () => {
        return getState(update(cache, key, miss));
    });
    const keyRef = useRef(key);

    useEffect(() => {
        const cacheListener = (changedKey) => {
            if (changedKey !== key) {
                return;
            }
            // If it was removed, rerun it
            if (!cache.has(key)) {
                return dispatch(update(cache, key, miss));
            }
            dispatch(cache.get(key));
        };
        const unsubscribeCache = cache.subscribe(cacheListener);
        // If the key is the same, just read the current value from the cache to ensure we're on the latest state.
        if (keyRef.current === key) {
            dispatch(cache.get(key));
        } else {
            // If the key has changed, retry the re-fetch strategy.
            dispatch(update(cache, key, miss));
            keyRef.current = key;
        }
        return unsubscribeCache;
    }, [key]);

    return state;
};

export default useCachedModelResult;
