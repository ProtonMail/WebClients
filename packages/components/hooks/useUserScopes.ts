import { useCallback } from 'react';
import JSBI from 'jsbi';

import { Api } from 'proton-shared/lib/interfaces';
import { queryScopes } from 'proton-shared/lib/api/auth';

import useApi from '../containers/api/useApi';
import useCache from '../containers/cache/useCache';
import useCachedModelResult from './useCachedModelResult';

const KEY = 'userScopes';

const getUserScopes = (api: Api) => api(queryScopes()).then((result: any = {}) => result.Scope);

export const USER_SCOPES = {
    DRIVE: 68719476736
};

export const hasScope = (scope: string, mask: number) => {
    const scopeInt = JSBI.BigInt(scope);
    const maskInt = JSBI.BigInt(mask);

    return JSBI.equal(JSBI.bitwiseAnd(scopeInt, maskInt), maskInt);
};

export const useUserScopes = () => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => getUserScopes(api), [api]);

    return useCachedModelResult(cache, KEY, miss);
};
