import { useCallback } from 'react';

import { Address } from '@proton/shared/lib/interfaces';
import { GetAddresses } from '@proton/shared/lib/interfaces/hooks/GetAddresses';
import { AddressesModel } from '@proton/shared/lib/models/addressesModel';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';

export const useGetAddresses = (): GetAddresses => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => AddressesModel.get(api), [api]);
    return useCallback(() => {
        return getPromiseValue(cache, AddressesModel.key, miss);
    }, [cache, miss]);
};

export const useAddresses = (): [Address[], boolean, any] => {
    const cache = useCache();
    const miss = useGetAddresses();
    return useCachedModelResult(cache, AddressesModel.key, miss);
};

export default useAddresses;
