import { useCallback } from 'react';
import { getPublicKeysEmailHelper } from 'proton-shared/lib/api/helpers/publicKeys';
import useCache from '../containers/cache/useCache';
import { getPromiseValue } from './useCachedModelResult';
import useApi from '../containers/api/useApi';

export const CACHE_KEY = 'PUBLIC_KEYS';

export const useGetPublicKeys = () => {
    const cache = useCache();
    const api = useApi();

    return useCallback(
        (email) => {
            if (!cache.has(CACHE_KEY)) {
                cache.set(CACHE_KEY, new Map());
            }
            const subCache = cache.get(CACHE_KEY);
            const miss = () => getPublicKeysEmailHelper(api, email);
            return getPromiseValue(subCache, email, miss);
        },
        [api, cache]
    );
};

export default useGetPublicKeys;
