import { useCallback } from 'react';
import { AddressesModel } from 'proton-shared/lib/models/addressesModel';
import useApi from '../containers/api/useApi';
import useCache from '../containers/cache/useCache';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';

export const useGetAddresses = () => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => AddressesModel.get(api), [api]);
    return useCallback(() => {
        return getPromiseValue(cache, AddressesModel.key, miss);
    }, [cache, miss]);
};

export const useAddresses = () => {
    const cache = useCache();
    const miss = useGetAddresses();
    return useCachedModelResult(cache, AddressesModel.key, miss);
};
