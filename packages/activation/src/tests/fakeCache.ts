import createCache from '@proton/shared/lib/helpers/cache';
import { Status } from '@proton/shared/lib/models/cache';

type CacheKeys = 'Labels';

const resolvedRequest = <T>(
    value: T
): {
    status: Status;
    value: T;
} => ({ status: Status.Resolved, value });

const cache = createCache();

const setToCache = (key: CacheKeys, value: any) => {
    cache.set(key, resolvedRequest(value));
};

const getFromCache = (key: CacheKeys) => cache.get(key);

/**
 * Sets the minimal required cache
 */
const setBaseCache = () => {
    setToCache('Labels', []);
};

const fakeCache = {
    instance: cache,
    get: getFromCache,
    set: setToCache,
    setBase: setBaseCache,
};

export default fakeCache;
