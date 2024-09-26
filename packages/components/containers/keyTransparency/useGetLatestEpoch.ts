import { useCallback } from 'react';

import { getPromiseValue } from '@proton/components/hooks/useCachedModelResult';
import { fetchLatestEpoch } from '@proton/key-transparency/lib';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { HOUR } from '@proton/shared/lib/constants';
import type { GetLatestEpoch } from '@proton/shared/lib/interfaces';

import { useApi } from '../../hooks';
import useCache from '../../hooks/useCache';

export const CACHE_KEY = 'KEY_TRANSPARENCY_EPOCH';

const DEFAULT_LIFETIME = 2 * HOUR;

const useGetLatestEpoch = (): GetLatestEpoch => {
    const cache = useCache();
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);
    const miss = useCallback(() => fetchLatestEpoch(silentApi), [silentApi]);
    return useCallback(
        (forceRefresh?: boolean) => {
            if (forceRefresh) {
                cache.delete(CACHE_KEY);
            }
            return getPromiseValue(cache, CACHE_KEY, miss, DEFAULT_LIFETIME);
        },
        [cache, miss]
    );
};

export default useGetLatestEpoch;
