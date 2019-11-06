import { useCallback } from 'react';
import useCache from '../containers/cache/useCache';
import { useGetAddresses } from './useAddresses';
import useCachedModelResult from './useCachedModelResult';
import { useGetAddressKeys } from './useGetAddressKeys';

export const CACHE_KEY = 'ADDRESS_KEYS';
export const KEY = 'ADDRESSES_KEYS';

export const useGetAddressesKeys = () => {
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    return useCallback(async () => {
        const addresses = await getAddresses();
        const keys = await Promise.all(addresses.map(({ ID: addressID }) => getAddressKeys(addressID)));
        return addresses.reduce((acc, { ID }, i) => {
            return {
                ...acc,
                [ID]: keys[i]
            };
        }, {});
    }, [getAddresses, getAddressKeys]);
};

export const useAddressesKeys = () => {
    const cache = useCache();
    const miss = useGetAddressesKeys();
    return useCachedModelResult(cache, KEY, miss);
};
