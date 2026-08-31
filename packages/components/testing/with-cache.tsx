import type { ComponentType } from 'react';

import { mockCache } from '@proton/testing/lib/cache';

import { CacheProvider } from '../containers/cache/Provider';

export const withCache =
    (cache = mockCache) =>
    <T extends {}>(Component: ComponentType<T>) =>
        function CacheProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <CacheProvider cache={cache}>
                    <Component {...props} />
                </CacheProvider>
            );
        };
