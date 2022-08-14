import { useCallback } from 'react';

import { UserModel as tsUserModel } from '@proton/shared/lib/interfaces';
import { UserModel } from '@proton/shared/lib/models/userModel';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';

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

export default useUser;
