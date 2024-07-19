import { useCache } from '@proton/components';
import type { Cache } from '@proton/shared/lib/helpers/cache';
import createCache from '@proton/shared/lib/helpers/cache';

const CACHE_KEY = 'Base64';

export type Base64Cache = Cache<string, string>;

export const useBase64Cache = (): Base64Cache => {
    const globalCache = useCache();

    if (!globalCache.has(CACHE_KEY)) {
        globalCache.set(CACHE_KEY, createCache());
    }

    return globalCache.get(CACHE_KEY);
};
