import { useCallback } from 'react';

import { DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import { getDecryptedAddressKeysHelper } from '@proton/shared/lib/keys';

import { useGetAddresses } from './useAddresses';
import useAuthentication from './useAuthentication';
import useCache from './useCache';
import { getPromiseValue } from './useCachedModelResult';
import { useGetUser } from './useUser';
import { useGetUserKeys } from './useUserKeys';

export const CACHE_KEY = 'ADDRESS_KEYS';

export const useGetAddressKeysRaw = (): ((id: string) => Promise<DecryptedAddressKey[]>) => {
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
            return getDecryptedAddressKeysHelper(address.Keys, user, userKeys, authentication.getPassword());
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

export default useGetAddressKeys;
