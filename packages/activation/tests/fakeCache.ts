import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import { Address, Key } from '@proton/shared/lib/interfaces';
import { STATUS } from '@proton/shared/lib/models/cache';

type CacheKeys = 'User' | 'Addresses' | 'Labels';

const resolvedRequest = <T>(
    value: T
): {
    status: STATUS;
    value: T;
} => ({ status: STATUS.RESOLVED, value });

const cache = createCache();

const setToCache = (key: CacheKeys, value: any) => {
    cache.set(key, resolvedRequest(value));
};

const getFromCache = (key: CacheKeys) => cache.get(key);

/**
 * Sets the minimal required cache
 */
const setBaseCache = () => {
    setToCache('User', { UsedSpace: 10, MaxSpace: 100 });
    setToCache('Addresses', []);
    setToCache('Labels', []);
};

/**
 * Adds an address to the cache
 * @param inputAddress
 */
const addAddressToCache = (inputAddress: Partial<Address>) => {
    const address = {
        ID: 'AddressID',
        Keys: [{ ID: 'KeyID' } as Key],
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Send: 1,
        Receive: 1,
        ...inputAddress,
    } as Address;

    const addressCache = cache.get('Addresses');
    // @ts-expect-error
    addressCache?.value?.push(address);
};

const fakeCache = {
    instance: cache,
    get: getFromCache,
    set: setToCache,
    setBase: setBaseCache,
    addAddress: addAddressToCache,
};

export default fakeCache;
