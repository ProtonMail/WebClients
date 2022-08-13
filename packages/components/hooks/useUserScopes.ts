import { useCallback } from 'react';

import { queryScopes } from '@proton/shared/lib/api/auth';
import { Api } from '@proton/shared/lib/interfaces';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

const KEY = 'userScopes';

const getUserScopes = (api: Api) => api(queryScopes()).then((result: any = {}) => result.Scope);

export const useUserScopes = () => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => getUserScopes(api), [api]);

    return useCachedModelResult(cache, KEY, miss);
};

export default useUserScopes;
