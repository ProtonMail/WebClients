import { useCallback } from 'react';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { Unwrap } from '@proton/shared/lib/interfaces/utils';

import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';
import useCache from './useCache';
import { useGetUserKeysRaw } from './useGetUserKeysRaw';

export const KEY = 'USER_KEYS';

export const useGetUserKeys = (): (() => Promise<DecryptedKey[]>) => {
    const cache = useCache();
    const miss = useGetUserKeysRaw();
    return useCallback(() => getPromiseValue(cache, KEY, miss), [miss]);
};

export const useUserKeys = (): [Unwrap<ReturnType<typeof useGetUserKeys>>, boolean, any] => {
    const cache = useCache();
    const getUserKeysAsync = useGetUserKeys();
    return useCachedModelResult(cache, KEY, getUserKeysAsync);
};
