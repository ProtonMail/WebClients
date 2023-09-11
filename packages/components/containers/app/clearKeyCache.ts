import { CryptoProxy } from '@proton/crypto';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { KEY as ADDRESSES_KEYS_CACHE } from '../../hooks/useAddressesKeys';
import { CACHE_KEY as ADDRESS_KEYS_CACHE } from '../../hooks/useGetAddressKeys';
import { KEY as ORG_KEYS_CACHE_KEY } from '../../hooks/useOrganizationKey';
import { KEY as USER_KEYS_CACHE_KEY } from '../../hooks/useUserKeys';

const clearCacheKeyObject = (cachedKey: DecryptedKey | undefined) => {
    if (cachedKey?.privateKey) {
        void CryptoProxy.clearKey({ key: cachedKey.privateKey }).catch(noop);
    }
    if (cachedKey?.publicKey) {
        void CryptoProxy.clearKey({ key: cachedKey.publicKey }).catch(noop);
    }
};

export const clearCachedKeys = (cachedKeys: DecryptedKey[] = []) => {
    cachedKeys.forEach?.(clearCacheKeyObject);
};

interface CacheRecord<T> {
    value?: T;
}
interface PromiseCacheRecord<T> {
    result?: T;
}

export const clearUsersKeysCache = (cache: Map<string, any>) => {
    const userKeysCache = cache.get(USER_KEYS_CACHE_KEY) as CacheRecord<DecryptedKey[]>;
    clearCachedKeys(userKeysCache?.value);
    cache.delete(USER_KEYS_CACHE_KEY);
};

export const clearAddressesKeysCache = (cache: Map<string, any>) => {
    const addressesKeysMap = cache.get(ADDRESS_KEYS_CACHE) as Map<string, CacheRecord<DecryptedKey[]>>;
    addressesKeysMap?.forEach((record) => clearCachedKeys(record?.value));
    addressesKeysMap?.clear();
    cache.delete(ADDRESS_KEYS_CACHE);
    cache.delete(ADDRESSES_KEYS_CACHE);
};

export const clearOrgKeyCache = (cache: Map<string, any>) => {
    const orgKeyCache = cache.get(ORG_KEYS_CACHE_KEY) as PromiseCacheRecord<DecryptedKey>;
    clearCacheKeyObject(orgKeyCache?.result);
    cache.delete(ORG_KEYS_CACHE_KEY);
};

export const clearKeysCache = (cache: Map<string, any>) => {
    clearUsersKeysCache(cache);
    clearAddressesKeysCache(cache);
    clearOrgKeyCache(cache);
};
