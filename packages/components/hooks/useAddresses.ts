import { useCallback } from 'react';
import { AddressesModel } from '@proton/shared/lib/models/addressesModel';
import { Address } from '@proton/shared/lib/interfaces';
import { eoDefaultAddress } from '@proton/shared/lib/mail/eo/constants';
import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';

export const useGetAddresses = (isOutside?: boolean): (() => Promise<Address[]>) => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => AddressesModel.get(api), [api]);
    return useCallback(() => {
        if (isOutside) {
            return getPromiseValue(cache, AddressesModel.key, () => new Promise(() => [eoDefaultAddress]));
        }
        return getPromiseValue(cache, AddressesModel.key, miss);
    }, [cache, miss]);
};

export const useAddresses = (isOutside?: boolean): [Address[], boolean, any] => {
    const cache = useCache();
    const miss = useGetAddresses(isOutside);
    return useCachedModelResult(cache, AddressesModel.key, miss);
};

export default useAddresses;
