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

import { ApiProvider } from './Context/ApiProvider';
import { AuthServiceProvider } from './Context/AuthServiceProvider';
import { AuthStoreProvider } from './Context/AuthStoreProvider';
import { ClientContext, ClientProvider } from './Context/ClientProvider';
import { StoreProvider } from './Store/StoreProvider';
import { Routes } from './Views/Routes';
import * as config from './config';

import './app.scss';

export const App = () => {
    return (
        <ConfigProvider config={config}>
            <CompatibilityCheck>
                <Icons />
                <ThemeProvider />
                <NotificationsProvider>
                    <ModalsProvider>
                        <AuthStoreProvider>
                            <ClientProvider>
                                <ClientContext.Consumer>
                                    {(client) => (
                                        <ApiProvider>
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
                                        </ApiProvider>
                                    )}
                                </ClientContext.Consumer>
                            </ClientProvider>
                        </AuthStoreProvider>
                    </ModalsProvider>
                </NotificationsProvider>
            </CompatibilityCheck>
        </ConfigProvider>
    );
};
