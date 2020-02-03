import { UserModel } from 'proton-shared/lib/models/userModel';
import { UserModel as tsUserModel } from 'proton-shared/lib/interfaces';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';
import useCache from '../containers/cache/useCache';
import { useCallback } from 'react';
import useApi from '../containers/api/useApi';

export const useGetUser = (): (() => Promise<tsUserModel>) => {
    const api = useApi();
    const cache = useCache();
    return useCallback(() => {
        return getPromiseValue(cache, UserModel.key, () => UserModel.get(api));
    }, [cache, api]);
};

export const useUser = (): [tsUserModel, boolean, any] => {
    const cache = useCache();
    const miss = useGetUser();
    return useCachedModelResult(cache, UserModel.key, miss);
};
