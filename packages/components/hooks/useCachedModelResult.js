import { useEffect, useState, useRef, useMemo } from 'react';
import { STATUS } from '@proton/shared/lib/models/cache';

const ERROR_IDX = 2;

export const getState = ({ value, status } = { status: STATUS.PENDING }, oldState = []) => {
    return [
        // The old state value is returned in case the model has been deleted from the cache
        status === STATUS.PENDING || status === STATUS.RESOLVED ? value || oldState[0] : undefined,
        status === STATUS.PENDING,
        status === STATUS.REJECTED ? value : undefined,
    ];
};

const getRecordPending = (promise) => {
    return {
        status: STATUS.PENDING,
        value: undefined,
        promise,
        timestamp: Date.now(),
    };
};

const getRecordThen = (promise) => {
    return promise
        .then((value) => {
            return {
                status: STATUS.RESOLVED,
                value,
                timestamp: Date.now(),
            };
        })
        .catch((error) => {
            return {
                status: STATUS.REJECTED,
                value: error,
                timestamp: Date.now(),
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
 * @param {Promise} promise
 * @return {Object}
 */
const update = (cache, key, promise) => {
    const record = getRecordPending(promise);
    cache.set(key, record);
    getRecordThen(promise).then((newRecord) => cache.get(key) === record && cache.set(key, newRecord));
    return record;
};

export const getIsRecordInvalid = (record, lifetime = Number.MAX_SAFE_INTEGER) => {
    return (
        !record ||
        record.status === STATUS.REJECTED ||
        (record.status === STATUS.RESOLVED && Date.now() - record.timestamp > lifetime)
    );
};

export const getPromiseValue = (cache, key, miss, lifetime) => {
    const oldRecord = cache.get(key);
    if (getIsRecordInvalid(oldRecord, lifetime)) {
        const record = update(cache, key, miss(key));
        return record.promise;
    }
    return oldRecord.promise || Promise.resolve(oldRecord.value);
};

/**
 * Caches a model globally in the cache. Can be updated from the event manager.
 * @param {Map} cache
 * @param {String | undefined} key
 * @param {Function} miss - Returning a promise
 * @return {[value, loading, error]}
 */
const useCachedModelResult = (cache, key, miss) => {
    const [forceRefresh, setForceRefresh] = useState();
    const latestValue = useRef();

    const result = useMemo(() => {
        const oldRecord = cache.get(key);
        // If no record, or it's the first time loading this hook and the promise was previously rejected, retry the fetch strategy.
        if (!oldRecord || (!latestValue.current && oldRecord.status === STATUS.REJECTED)) {
            return getState(update(cache, key, miss(key)), latestValue.current);
        }
        return getState(oldRecord, latestValue.current);
    }, [cache, key, miss, forceRefresh]);

    useEffect(() => {
        // https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
        latestValue.current = result;
    });

    useEffect(() => {
        const checkForChange = () => {
            const oldRecord = cache.get(key);
            if (!oldRecord) {
                return setForceRefresh({});
            }
            const newValue = getState(oldRecord, latestValue.current);
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

    // Throw in render to allow the error boundary to catch it
    if (result[ERROR_IDX]) {
        throw result[ERROR_IDX];
    }

    return result;
};

export default useCachedModelResult;
