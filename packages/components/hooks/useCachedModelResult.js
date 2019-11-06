import { useEffect, useState, useRef, useMemo } from 'react';
import { STATUS } from 'proton-shared/lib/models/cache';

export const getState = ({ value, status } = { status: STATUS.PENDING }, oldState = []) => {
    return [
        // The old state value is returned in case the model has been deleted from the cache
        status === STATUS.PENDING || status === STATUS.RESOLVED ? value || oldState[0] : undefined,
        status === STATUS.PENDING,
        status === STATUS.REJECTED ? value : undefined
    ];
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
export const update = (cache, key, miss) => {
    const oldRecord = cache.get(key);
    if (!oldRecord || oldRecord.status === STATUS.REJECTED) {
        const promise = miss(key);
        const record = getRecordPending(promise);
        cache.set(key, record);
        getRecordThen(promise).then((newRecord) => cache.get(key) === record && cache.set(key, newRecord));
        return record;
    }
    return oldRecord;
};

export const getPromiseValue = (cache, key, miss) => {
    const record = update(cache, key, miss);
    return record.promise || record.value;
};

/**
 * Caches a model globally in the cache. Can be updated from the event manager.
 * @param {Map} cache
 * @param {String} key
 * @param {Function} miss - Returning a promise
 * @return {[value, loading, error]}
 */
const useCachedModelResult = (cache, key, miss) => {
    const [forceRefresh, setForceRefresh] = useState();
    const latestValue = useRef();

    const result = useMemo(() => {
        return getState(update(cache, key, miss), latestValue.current);
    }, [cache, key, miss, forceRefresh]);

    useEffect(() => {
        // https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
        latestValue.current = result;
    });

    useEffect(() => {
        const checkForChange = () => {
            const newValue = getState(cache.get(key), latestValue.current);
            if (newValue.some((value, i) => value !== latestValue.current[i])) {
                setForceRefresh({});
            }
        };
        const cacheListener = (changedKey) => {
            if (changedKey !== key) {
                return;
            }
            checkForChange();
        };
        checkForChange();
        return cache.subscribe(cacheListener);
    }, [cache, key, miss]);

    return result;
};

export default useCachedModelResult;
