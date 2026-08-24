import { useContext } from 'react';

import type { Cache } from '@proton/shared/lib/helpers/cache';

import { CacheContext } from './cacheContext';

export const useCache = <K = string, V = any>() => {
    const cache = useContext(CacheContext);

    if (!cache) {
        throw new Error('Trying to use uninitialized CacheContext');
    }

    return cache as Cache<K, V>;
};
