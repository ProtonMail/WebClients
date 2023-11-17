import { useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';

import {
    CompatibilityCheck,
    ConfigProvider,
    Icons,
    ModalsChildren,
    ModalsProvider,
    NotificationsChildren,
    NotificationsProvider,
} from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { NavigationProvider } from '@proton/pass/components/Navigation/NavigationProvider';
import { getBasename } from '@proton/shared/lib/authentication/pathnameHelper';

import { PASS_CONFIG } from '../lib/core';
import { AuthServiceProvider } from './Context/AuthServiceProvider';
import { ClientContext, ClientProvider } from './Context/ClientProvider';
import { Routes } from './Routing/Routes';
import { ServiceWorkerProvider } from './ServiceWorker/ServiceWorkerProvider';
import { StoreProvider } from './Store/StoreProvider';

import './app.scss';

export const App = () => {
    const onLink = useCallback((url) => window.open(url, '_blank'), []);

    return (
        <ConfigProvider config={PASS_CONFIG}>
            <CompatibilityCheck>
                <Icons />
                <ThemeProvider />
                <NotificationsProvider>
                    <ModalsProvider>
                        <ServiceWorkerProvider>
                            <ClientProvider>
                                <ClientContext.Consumer>
                                    {(client) => (
                                        <BrowserRouter basename={getBasename(client.state.localID)}>
                                            <NavigationProvider onLink={onLink}>
                                                <AuthServiceProvider>
                                                    <StoreProvider>
                                                        <Routes />
                                                        <Portal>
                                                            <ModalsChildren />
                                                            <NotificationsChildren />
                                                        </Portal>
                                                    </StoreProvider>
                                                </AuthServiceProvider>
                                            </NavigationProvider>
                                        </BrowserRouter>
                                    )}
                                </ClientContext.Consumer>
                            </ClientProvider>
                        </ServiceWorkerProvider>
                    </ModalsProvider>
                </NotificationsProvider>
            </CompatibilityCheck>
        </ConfigProvider>
    );
};
