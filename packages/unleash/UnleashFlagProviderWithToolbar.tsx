import { type ReactNode, Suspense, lazy } from 'react';

import { FlagProvider } from '@unleash/proxy-client-react';
import type { UnleashClient } from 'unleash-proxy-client';

import { isUnleashToolbarEnabled } from './isUnleashToolbarEnabled';

const LazyUnleashToolbarFlagProvider = lazy(() => import('./UnleashToolbarFlagProvider'));

interface Props {
    children: ReactNode;
    unleashClient: UnleashClient;
    /** Shown instead of `children` while the toolbar chunk loads (only when the toolbar is enabled). */
    fallback?: ReactNode;
}

const FlagProviderWrapper = ({ children, unleashClient }: Props) => (
    <FlagProvider unleashClient={unleashClient} startClient={false}>
        {children}
    </FlagProvider>
);

export const UnleashFlagProviderWithToolbar = ({ children, unleashClient, fallback = null }: Props) => {
    if (!isUnleashToolbarEnabled()) {
        return <FlagProviderWrapper unleashClient={unleashClient}>{children}</FlagProviderWrapper>;
    }

    return (
        <Suspense fallback={fallback}>
            <LazyUnleashToolbarFlagProvider unleashClient={unleashClient}>{children}</LazyUnleashToolbarFlagProvider>
        </Suspense>
    );
};
