import type { ReactNode } from 'react';

import { UnleashToolbarProvider } from '@unleash/toolbar/react';
import '@unleash/toolbar/toolbar.css';
import type { UnleashClient } from 'unleash-proxy-client';

import { FlagProvider } from './proxy';

interface Props {
    children: ReactNode;
    unleashClient: UnleashClient;
}

const UnleashToolbarFlagProvider = ({ children, unleashClient }: Props) => {
    return (
        <UnleashToolbarProvider
            client={unleashClient}
            FlagProvider={FlagProvider}
            startClient={false}
            toolbarOptions={{
                storageMode: 'local',
                position: 'bottom-right',
            }}
        >
            {children}
        </UnleashToolbarProvider>
    );
};

export default UnleashToolbarFlagProvider;
