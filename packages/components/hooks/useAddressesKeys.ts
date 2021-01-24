import { useCallback } from 'react';
import { Address, DecryptedKey } from 'proton-shared/lib/interfaces';
import { Unwrap } from 'proton-shared/lib/interfaces/utils';
import useCache from './useCache';
import { useGetAddresses } from './useAddresses';
import useCachedModelResult from './useCachedModelResult';
import { useGetAddressKeys } from './useGetAddressKeys';

export const KEY = 'ADDRESSES_KEYS';

export const useGetAddressesKeys = (): (() => Promise<{ address: Address; keys: DecryptedKey[] }[]>) => {
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    return useCallback(async () => {
        const addresses = await getAddresses();
        return Promise.all(
            addresses.map(async (address) => {
                return {
                    address,
                    keys: await getAddressKeys(address.ID),
                };
            })
        );
    }, [getAddresses, getAddressKeys]);
};

export const useAddressesKeys = (): [Unwrap<ReturnType<typeof useGetAddressesKeys>>, boolean, any] => {
    const cache = useCache();
    const miss = useGetAddressesKeys();
    return useCachedModelResult(cache, KEY, miss);
};
