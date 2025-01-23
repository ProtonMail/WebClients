import { useCallback } from 'react';

import { getKTUserContext } from '@proton/account/kt/actions';
import { useDispatch } from '@proton/redux-shared-store';
import getPublicKeysEmailHelper from '@proton/shared/lib/api/helpers/getPublicKeysEmailHelper';
import { MINUTE } from '@proton/shared/lib/constants';
import type { GetPublicKeysForInbox } from '@proton/shared/lib/interfaces/hooks/GetPublicKeysForInbox';

import useApi from './useApi';
import useCache from './useCache';
import { getPromiseValue } from './useCachedModelResult';

export const CACHE_KEY = 'PUBLIC_KEYS';

const DEFAULT_LIFETIME = 30 * MINUTE;

/**
 * Get public keys valid in the context of Inbox apps.
 * In particular, internal address keys from external accounts are not returned.
 */
export const useGetPublicKeysForInbox = () => {
    const cache = useCache();
    const api = useApi();
    const dispatch = useDispatch();
    return useCallback<GetPublicKeysForInbox>(
        async ({
            email,
            lifetime = DEFAULT_LIFETIME,
            internalKeysOnly,
            includeInternalKeysWithE2EEDisabledForMail,
        }) => {
            if (!cache.has(CACHE_KEY)) {
                cache.set(CACHE_KEY, new Map());
            }
            const ktUserContext = await dispatch(getKTUserContext());
            const subCache = cache.get(CACHE_KEY);
            const miss = () =>
                getPublicKeysEmailHelper({
                    email,
                    internalKeysOnly,
                    includeInternalKeysWithE2EEDisabledForMail,
                    api,
                    ktUserContext,
                    silence: true,
                    noCache: lifetime === 0,
                });
            const cacheEntryID = `${email},${ktUserContext.ktActivation},${internalKeysOnly},${includeInternalKeysWithE2EEDisabledForMail}`;
            return getPromiseValue(subCache, cacheEntryID, miss, lifetime);
        },
        [api, cache]
    );
};

export default useGetPublicKeysForInbox;
