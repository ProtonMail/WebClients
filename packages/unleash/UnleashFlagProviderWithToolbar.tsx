import { type ReactNode, Suspense, lazy } from 'react';

import type { UnleashClient } from 'unleash-proxy-client';

import { isUnleashToolbarEnabled } from './isUnleashToolbarEnabled';
import { FlagProvider } from './proxy';

const LazyUnleashToolbarFlagProvider = lazy(() => import('./UnleashToolbarFlagProvider'));

interface Props {
    children: ReactNode;
    unleashClient: UnleashClient;
}

const FlagProviderWrapper = ({ children, unleashClient }: Props) => (
    <FlagProvider unleashClient={unleashClient} startClient={false}>
        {children}
    </FlagProvider>
);

export const UnleashFlagProviderWithToolbar = ({ children, unleashClient }: Props) => {
    if (!isUnleashToolbarEnabled()) {
        return <FlagProviderWrapper unleashClient={unleashClient}>{children}</FlagProviderWrapper>;
    }

    return (
        <Suspense fallback={null}>
            <LazyUnleashToolbarFlagProvider unleashClient={unleashClient}>{children}</LazyUnleashToolbarFlagProvider>
        </Suspense>
    );
};
