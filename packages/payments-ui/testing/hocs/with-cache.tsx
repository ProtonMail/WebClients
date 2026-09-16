import type { ComponentType } from 'react';

import { CacheContext } from '@proton/app-context/cacheContext';
import createCache from '@proton/shared/lib/helpers/cache';

const mockCache = createCache();

export const withCache =
    (cache = mockCache) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function CacheProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <CacheContext.Provider value={cache}>
                    <Component {...props} />
                </CacheContext.Provider>
            );
        };
