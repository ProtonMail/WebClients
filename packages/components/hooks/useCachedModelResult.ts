import type { Cache } from '@proton/shared/lib/helpers/cache';
import { STATUS } from '@proton/shared/lib/models/cache';

type Record<Value> = {
    status: STATUS;
    timestamp: number;
    value?: Value;
    promise?: Promise<Value>;
};

const getRecordPending = <Value>(promise: Promise<Value>): Record<Value> => {
    return {
        status: STATUS.PENDING,
        value: undefined,
        promise,
        timestamp: Date.now(),
    };
};

const getRecordThen = <Value>(promise: Promise<Value>): Promise<Record<Value>> => {
    return promise
        .then((value) => {
            return {
                status: STATUS.RESOLVED,
                value,
                timestamp: Date.now(),
                promise: undefined,
            };
        })
        .catch((error) => {
            return {
                status: STATUS.REJECTED,
                value: error,
                timestamp: Date.now(),
                promise: undefined,
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
 */
const update = <Value, Key>(cache: Cache<Key, Record<Value>>, key: Key, promise: Promise<Value>) => {
    const record = getRecordPending(promise);
    cache.set(key, record);
    getRecordThen(promise).then((newRecord) => {
        if (cache.get(key) === record) {
            cache.set(key, newRecord);
        }
    });
    return promise;
};

export const getIsRecordInvalid = <Value>(record: Record<Value> | undefined, lifetime = Number.MAX_SAFE_INTEGER) => {
    return (
        !record ||
        record.status === STATUS.REJECTED ||
        (record.status === STATUS.RESOLVED && Date.now() - record.timestamp > lifetime)
    );
};

export const getPromiseValue = <Value, Key>(
    cache: Cache<Key, Record<Value>>,
    key: Key,
    miss: (key: Key) => Promise<Value>,
    lifetime?: number
): Promise<Value> => {
    const oldRecord = cache.get(key);
    if (!oldRecord || getIsRecordInvalid(oldRecord, lifetime)) {
        return update(cache, key, miss(key));
    }
    if (oldRecord.promise) {
        return oldRecord.promise;
    }
    return Promise.resolve(oldRecord.value!);
};
