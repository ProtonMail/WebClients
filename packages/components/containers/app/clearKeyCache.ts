import { CachedKey } from 'proton-shared/lib/interfaces';
import { KEY as USER_KEYS_CACHE_KEY } from '../../hooks/useUserKeys';
import { KEY as ADDRESSES_KEYS_CACHE } from '../../hooks/useAddressesKeys';

const clearCachedKeys = (cachedKeys: CachedKey[] = []) => {
    cachedKeys.forEach((cachedKey) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        cachedKey?.privateKey?.clearPrivateParams();
    });
};

export default (cache: Map<string, any>) => {
    const userKeysCache = cache.get(USER_KEYS_CACHE_KEY);
    const addressesKeysCache = cache.get(ADDRESSES_KEYS_CACHE);
    clearCachedKeys(userKeysCache ? userKeysCache.value : []);
    if (addressesKeysCache && addressesKeysCache.value) {
        const addressIDs = Object.keys(addressesKeysCache.value);
        for (const addressID of addressIDs) {
            clearCachedKeys(addressesKeysCache.value[addressID]);
        }
    }
};
