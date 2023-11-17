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
import { getBasename } from '@proton/shared/lib/authentication/pathnameHelper';

import { PASS_CONFIG } from '../lib/core';
import { AuthServiceProvider } from './Context/AuthServiceProvider';
import { ClientContext, ClientProvider } from './Context/ClientProvider';
import { ServiceWorkerProvider } from './ServiceWorker/ServiceWorkerProvider';
import { StoreProvider } from './Store/StoreProvider';
import { Routes } from './Views/Routes';

import './app.scss';

export const App = () => {
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
                                            <AuthServiceProvider>
                                                <StoreProvider>
                                                    <Routes />
                                                    <Portal>
                                                        <ModalsChildren />
                                                        <NotificationsChildren />
                                                    </Portal>
                                                </StoreProvider>
                                            </AuthServiceProvider>
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
