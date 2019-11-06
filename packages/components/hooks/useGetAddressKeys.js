import { useCallback } from 'react';
import {
    decryptKeyWithFormat,
    decryptPrivateKeyArmored,
    getAddressKeyPassword,
    splitKeys
} from 'proton-shared/lib/keys/keys';
import { noop } from 'proton-shared/lib/helpers/function';
import useAuthentication from '../containers/authentication/useAuthentication';
import useCache from '../containers/cache/useCache';
import { useGetAddresses } from './useAddresses';
import { useGetUserKeys } from './useUserKeys';
import { getPromiseValue } from './useCachedModelResult';
import { useGetUser } from './useUser';

export const CACHE_KEY = 'ADDRESS_KEYS';

export const useGetAddressKeysRaw = () => {
    const authentication = useAuthentication();
    const getUser = useGetUser();
    const getAddresses = useGetAddresses();
    const getUserKeys = useGetUserKeys();

    return useCallback(
        async (addressID) => {
            const [{ OrganizationPrivateKey }, Addresses, userKeys] = await Promise.all([
                getUser(),
                getAddresses(),
                getUserKeys()
            ]);

            const Address = Addresses.find(({ ID: AddressID }) => AddressID === addressID);
            if (!Address) {
                return [];
            }

            const keyPassword = authentication.getPassword();

            const organizationKey = OrganizationPrivateKey
                ? await decryptPrivateKeyArmored(OrganizationPrivateKey, keyPassword).catch(noop)
                : undefined;

            const { privateKeys, publicKeys } = splitKeys(userKeys);
            return Promise.all(
                Address.Keys.map(async (Key) => {
                    return decryptKeyWithFormat(
                        Key,
                        await getAddressKeyPassword(Key, { organizationKey, privateKeys, publicKeys, keyPassword })
                    );
                })
            );
        },
        [getUser, getAddresses, getUserKeys]
    );
};

export const useGetAddressKeys = () => {
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
