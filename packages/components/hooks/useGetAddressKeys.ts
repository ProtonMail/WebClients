import { useCallback } from 'react';
import { decryptPrivateKey } from 'pmcrypto';
import { getAddressKeyToken, splitKeys } from 'proton-shared/lib/keys/keys';
import { CachedKey, Key as tsKey } from 'proton-shared/lib/interfaces';
import useAuthentication from './useAuthentication';
import useCache from './useCache';
import { useGetAddresses } from './useAddresses';
import { useGetUserKeys } from './useUserKeys';
import { getPromiseValue } from './useCachedModelResult';
import { useGetUser } from './useUser';

export const CACHE_KEY = 'ADDRESS_KEYS';

export const useGetAddressKeysRaw = (): ((id: string) => Promise<CachedKey[]>) => {
    const authentication = useAuthentication();
    const getUser = useGetUser();
    const getAddresses = useGetAddresses();
    const getUserKeys = useGetUserKeys();

    return useCallback(
        async (addressID) => {
            const [{ OrganizationPrivateKey }, Addresses, userKeys] = await Promise.all([
                getUser(),
                getAddresses(),
                getUserKeys(),
            ]);

            const Address = Addresses.find(({ ID: AddressID }) => AddressID === addressID);
            if (!Address) {
                return [];
            }

            const { Keys } = Address;
            const mailboxPassword = authentication.getPassword();

            const organizationKey = OrganizationPrivateKey
                ? await decryptPrivateKey(OrganizationPrivateKey, mailboxPassword).catch(() => undefined)
                : undefined;

            const { privateKeys, publicKeys } = splitKeys(userKeys);

            const process = async (Key: tsKey) => {
                try {
                    const { PrivateKey, Token, Signature } = Key;
                    const keyPassword = Token
                        ? await getAddressKeyToken({
                              Token,
                              Signature,
                              organizationKey,
                              privateKeys,
                              publicKeys,
                          })
                        : mailboxPassword;
                    const privateKey = await decryptPrivateKey(PrivateKey, keyPassword);
                    return {
                        Key,
                        privateKey,
                        publicKey: privateKey.toPublic(),
                    };
                } catch (e) {
                    return {
                        Key,
                        error: e,
                    };
                }
            };

            const [primaryKey, ...restKeys] = Keys;
            const primaryKeyResult = await process(primaryKey);
            // In case the primary key fails to decrypt, something is broken, so don't even try to decrypt the rest of the keys.
            if (primaryKeyResult.error) {
                return [primaryKeyResult, ...restKeys.map((Key) => ({ Key, error: primaryKeyResult.error }))];
            }
            const restKeysResult = await Promise.all(restKeys.map(process));
            return [primaryKeyResult, ...restKeysResult];
        },
        [getUser, getAddresses, getUserKeys]
    );
};

export const useGetAddressKeys = (): ((id: string) => Promise<CachedKey[]>) => {
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
