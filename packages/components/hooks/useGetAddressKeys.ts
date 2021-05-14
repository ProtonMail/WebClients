import { GetAddressKeys } from 'proton-shared/lib/interfaces/hooks/GetAddressKeys';
import { useCallback } from 'react';
import { DecryptedKey } from 'proton-shared/lib/interfaces';
import { getDecryptedAddressKeys } from 'proton-shared/lib/keys';

import useAuthentication from './useAuthentication';
import useCache from './useCache';
import { useGetAddresses } from './useAddresses';
import { useGetUserKeys } from './useUserKeys';
import { getPromiseValue } from './useCachedModelResult';
import { useGetUser } from './useUser';

export const CACHE_KEY = 'ADDRESS_KEYS';

export const useGetAddressKeysRaw = (): ((id: string) => Promise<DecryptedKey[]>) => {
    const authentication = useAuthentication();
    const getUser = useGetUser();
    const getAddresses = useGetAddresses();
    const getUserKeys = useGetUserKeys();

    return useCallback(
        async (addressID) => {
            const [user, userKeys, addresses] = await Promise.all([getUser(), getUserKeys(), getAddresses()]);
            const address = addresses.find(({ ID: AddressID }) => AddressID === addressID);
            if (!address) {
                return [];
            }
            return getDecryptedAddressKeys({
                address,
                addressKeys: address.Keys,
                user,
                userKeys,
                keyPassword: authentication.getPassword(),
            });
        },
        [getUser, getAddresses, getUserKeys]
    );
};

export const useGetAddressKeys = (): GetAddressKeys => {
    const cache = useCache();
    const miss = useGetAddressKeysRaw();

    return useCallback(
        (key) => {
            if (!cache.has(CACHE_KEY)) {
                cache.set(CACHE_KEY, new Map());
            }
            const subCache = cache.get(CACHE_KEY);
            return getPromiseValue(subCache, key, miss);
        },
        [cache, miss]
    );
};
