import { KEY as USER_KEYS_CACHE_KEY } from '../../hooks/useUserKeys';
import { KEY as ADDRESSES_KEYS_CACHE } from '../../hooks/useAddressesKeys';

const clearCachedKeys = (cachedKeys = []) => {
    cachedKeys.forEach(({ privateKey } = {}) => {
        if (privateKey) {
            privateKey.clearPrivateParams();
        }
    });
};

export default (cache) => {
    const userKeysCache = cache.get(USER_KEYS_CACHE_KEY);
    const addressesKeysCache = cache.get(ADDRESSES_KEYS_CACHE);
    clearCachedKeys(userKeysCache ? userKeysCache.value : []);
    if (addressesKeysCache && addressesKeysCache.value) {
        const addressIDs = Object.keys(addressesKeysCache.value);
        for (let addressID of addressIDs) {
            clearCachedKeys(addressesKeysCache.value[addressID]);
        }
    }
};
