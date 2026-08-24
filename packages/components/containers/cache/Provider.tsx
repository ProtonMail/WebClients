import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { CacheContext } from '@proton/app-context/cacheContext';
import type { Cache } from '@proton/shared/lib/helpers/cache';
import createCache from '@proton/shared/lib/helpers/cache';

interface Props<K, V> {
    cache?: Cache<K, V>;
    children: ReactNode;
}

export const CacheProvider = <K, V>({ cache, children }: Props<K, V>) => {
    const cacheRef = useRef<Cache<string, any>>(cache as any);
    if (!cacheRef.current) {
        cacheRef.current = createCache<string, any>();
    }
    useEffect(() => {
        const cache = cacheRef.current;
        return () => {
            cache.clear();
            cache.clearListeners();
        };
    }, []);
    return <CacheContext.Provider value={cacheRef.current}>{children}</CacheContext.Provider>;
};
