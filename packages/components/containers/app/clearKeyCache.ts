import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { CryptoProxy } from '@proton/crypto';
import { KEY as USER_KEYS_CACHE_KEY } from '../../hooks/useUserKeys';
import { CACHE_KEY as ADDRESS_KEYS_CACHE } from '../../hooks/useGetAddressKeys';

const clearCachedKeys = (cachedKeys: DecryptedKey[] = []) => {
    cachedKeys.forEach?.((cachedKey) => {
        if (cachedKey?.privateKey) {
            void CryptoProxy.clearKey({ key: cachedKey.privateKey }).catch(() => {});
        }
        if (cachedKey?.publicKey) {
            void CryptoProxy.clearKey({ key: cachedKey.publicKey }).catch(() => {});
        }
    });
};

interface CacheRecord<T> {
    value?: T;
}

export default (cache: Map<string, any>) => {
    const userKeysCache = cache.get(USER_KEYS_CACHE_KEY) as CacheRecord<DecryptedKey[]>;
    const addressesKeysMap = cache.get(ADDRESS_KEYS_CACHE) as Map<string, CacheRecord<DecryptedKey[]>>;
    clearCachedKeys(userKeysCache?.value);
    addressesKeysMap?.forEach((record) => clearCachedKeys(record?.value));
};
