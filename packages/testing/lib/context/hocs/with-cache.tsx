import type { ComponentType } from 'react';

import { CacheProvider } from '@proton/components/containers/cache/Provider';

import { mockCache } from '../../cache';

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
