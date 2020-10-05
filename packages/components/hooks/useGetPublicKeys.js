import { useCallback } from 'react';
import getPublicKeysEmailHelper from 'proton-shared/lib/api/helpers/getPublicKeysEmailHelper';
import { MINUTE } from 'proton-shared/lib/constants';
import useCache from './useCache';
import { getPromiseValue } from './useCachedModelResult';
import useApi from './useApi';

export const CACHE_KEY = 'PUBLIC_KEYS';

const DEFAULT_LIFETIME = 30 * MINUTE;

export const useGetPublicKeys = () => {
    const cache = useCache();
    const api = useApi();

    return useCallback(
        (email, lifetime = DEFAULT_LIFETIME) => {
            if (!cache.has(CACHE_KEY)) {
                cache.set(CACHE_KEY, new Map());
            }
            const subCache = cache.get(CACHE_KEY);
            const miss = () => getPublicKeysEmailHelper(api, email, true);
            return getPromiseValue(subCache, email, miss, lifetime);
        },
        [api, cache]
    );
};

export default useGetPublicKeys;
