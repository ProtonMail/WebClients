import { useCallback } from 'react';
import { CachedKey } from 'proton-shared/lib/interfaces';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';
import useCache from './useCache';
import { useGetUserKeysRaw } from './useGetUserKeysRaw';

export const KEY = 'USER_KEYS';

export const useGetUserKeys = (): (() => Promise<CachedKey[]>) => {
    const cache = useCache();
    const miss = useGetUserKeysRaw();
    return useCallback(async () => {
        return getPromiseValue(cache, KEY, miss);
    }, [miss]);
};

export const useUserKeys = (): [CachedKey[], boolean, any] => {
    const cache = useCache();
    const getUserKeysAsync = useGetUserKeys();
    return useCachedModelResult(cache, KEY, getUserKeysAsync);
};
