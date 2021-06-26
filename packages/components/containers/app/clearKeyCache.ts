import { DecryptedKey } from 'proton-shared/lib/interfaces';
import { KEY as USER_KEYS_CACHE_KEY } from '../../hooks/useUserKeys';
import { CACHE_KEY as ADDRESS_KEYS_CACHE } from '../../hooks/useGetAddressKeys';

const clearCachedKeys = (cachedKeys: DecryptedKey[] = []) => {
    cachedKeys.forEach?.((cachedKey) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        cachedKey?.privateKey?.clearPrivateParams();
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
