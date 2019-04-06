import { useEffect, useCallback, useState, useRef } from 'react';
import { STATUS } from 'proton-shared/lib/models/cache';

/**
 * Trigger the async function and update the cache.
 * @param {Object} cache
 * @param {String} key
 * @param {Function} miss
 * @returns {object}
 */
const load = (cache, key, miss) => {
    const promise = miss()
        .then(
            (value) => {
                return {
                    status: STATUS.RESOLVED,
                    value
                };
            },
            (error) => {
                return {
                    status: STATUS.REJECTED,
                    value: error
                };
            }
        )
        .then((resolvedRecord) => {
            cache.set(key, resolvedRecord);
        });

    const record = {
        status: STATUS.PENDING,
        value: promise
    };

    cache.set(key, record);

    return record;
};

/**
 * Return record from the cache. Triggers it to load in case none exists.
 * Throws an error in case it's been rejected.
 * @param {Object} cache
 * @param {String} key
 * @param {Function} miss
 * @returns {Object}
 */
const readCache = (cache, key, miss) => {
    if (cache.has(key)) {
        const record = cache.get(key);

        if (record.status === STATUS.REJECTED) {
            throw record.value;
        }

        return record;
    }

    return load(cache, key, miss);
};

const getState = ({ value, status }) => {
    return [status === STATUS.RESOLVED ? value : undefined, status === STATUS.PENDING];
};

/**
 * Cached hook returning an array of 3 values containing
 * [the value, loading boolean, refresh fn]
 * @param {Object} cache - The cache to place the result in
 * @param {String} key - The key with which to cache the result
 * @param {Function} miss - The function returning the promise
 * @returns {Array}
 */
const useCachedResult = (cache, key, miss) => {
    const record = readCache(cache, key, miss);

    const refresh = useCallback(() => {
        if (cache.has(key)) {
            const record = cache.get(key);
            // Don't refresh in case it's pending
            if (record.status === STATUS.PENDING) {
                return;
            }
        }
        load(cache, key, miss);
    }, [key, miss]);

    const [state, setState] = useState(() => {
        return getState(record);
    });
    const dataRef = useRef(record);

    useEffect(() => {
        const cacheListener = (changedKey) => {
            if (changedKey !== key) {
                return;
            }
            // Handle case when it's been deleted
            if (!cache.has(key)) {
                dataRef.current = undefined;
                return;
            }

            const record = cache.get(key);
            // If the value for this key has changed in the cache.
            if (dataRef.current === record) {
                return;
            }
            dataRef.current = record;
            setState(getState(record));
        };

        cacheListener(key);
        const unsubscribeCache = cache.subscribe(cacheListener);
        return () => {
            unsubscribeCache();
        };
    }, [key]);

    return [...state, refresh];
};

export default useCachedResult;
