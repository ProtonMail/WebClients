import createCache from '@proton/shared/lib/helpers/cache';

export const mockCache = createCache();

export const clearCache = () => mockCache.clear();
