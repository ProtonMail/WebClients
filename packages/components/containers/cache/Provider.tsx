import { ReactNode, useEffect } from 'react';
import { Cache } from '@proton/shared/lib/helpers/cache';
import CacheContext from './cacheContext';

interface Props<K, V> {
    cache: Cache<K, V>;
    children: ReactNode;
}
const Provider = <K, V>({ cache, children }: Props<K, V>) => {
    useEffect(() => {
        return () => {
            cache.clear();
            cache.clearListeners();
        };
    }, []);

    return <CacheContext.Provider value={cache}>{children}</CacheContext.Provider>;
};

export default Provider;
