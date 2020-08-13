import { useCallback } from 'react';
import { CachedKey } from 'proton-shared/lib/interfaces';
import useCache from './useCache';
import { useGetAddresses } from './useAddresses';
import useCachedModelResult from './useCachedModelResult';
import { useGetAddressKeys } from './useGetAddressKeys';

export const KEY = 'ADDRESSES_KEYS';

export const useGetAddressesKeys = (): (() => Promise<{ [key: string]: CachedKey[] }>) => {
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    return useCallback(async () => {
        const addresses = await getAddresses();
        const keys = await Promise.all(addresses.map(({ ID: addressID }) => getAddressKeys(addressID)));
        return addresses.reduce((acc, { ID }, i) => {
            return {
                ...acc,
                [ID]: keys[i],
            };
        }, {});
    }, [getAddresses, getAddressKeys]);
};

export const useAddressesKeys = (): [{ [key: string]: CachedKey[] }, boolean, any] => {
    const cache = useCache();
    const miss = useGetAddressesKeys();
    return useCachedModelResult(cache, KEY, miss);
};
