import { Fragment, useMemo, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import sentry from '@proton/shared/lib/helpers/sentry';
import {
    ErrorBoundary,
    StandardErrorPage,
    Icons,
    PreventLeaveProvider,
    ConfigProvider,
    CompatibilityCheck,
    RightToLeftProvider,
    ThemeProvider,
    ModalsProvider,
    ApiProvider,
    CacheProvider,
    NotificationsChildren,
    NotificationsHijack,
    CreateNotificationOptions,
} from '@proton/components';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import { APPS } from '@proton/shared/lib/constants';

import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import createAuthentication from '@proton/shared/lib/authentication/createAuthenticationStore';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';
import createCache from '@proton/shared/lib/helpers/cache';
import { noop } from '@proton/shared/lib/helpers/function';

import * as config from '../app/config';
import '../app/app.scss';
import Setup from './Setup';
import broadcast, { MessageType } from './broadcast';

initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.0',
    ...config,
    APP_NAME: APPS.PROTONACCOUNTLITE,
};

sentry(enhancedConfig);

const authentication = createAuthentication(createSecureSessionStorage());
const cache = createCache<string, any>();

const App = () => {
    const [UID, setUID] = useState<string | undefined>(() => authentication.getUID());
    const [isLogout, setLogout] = useState(false);

    const handleLogin = (UID: string) => {
        authentication.setUID(UID);
        setUID(UID);
    };

    const handleLogout = () => {
        // If logout happens, we explicitly set a state to stop the process. There's nothing that can recover it.
        setLogout(true);
        broadcast({ type: MessageType.CLOSE });
        authentication.setUID(undefined);
        setUID(undefined);
    };

    const authenticationValue = useMemo(() => {
        if (!UID) {
            return {
                // Handled in the callback only
                login: noop,
            };
        }
        return {
            UID,
            ...authentication,
            logout: handleLogout,
            onLogout: noop as any,
        };
    }, [UID]);

    const handleNotificationCreate = (options: CreateNotificationOptions) => {
        const { type = 'success', text } = options;

        if (typeof text === 'string') {
            broadcast({
                type: MessageType.NOTIFICATION,
                payload: { type, text },
            });
        }
    };

    return (
        <ConfigProvider config={enhancedConfig}>
            <CompatibilityCheck>
                <Icons />
                <RightToLeftProvider>
                    <Fragment key={UID}>
                        <ThemeProvider>
                            <Router>
                                <PreventLeaveProvider>
                                    <NotificationsHijack onCreate={handleNotificationCreate}>
                                        <ModalsProvider>
                                            <ApiProvider UID={UID} config={enhancedConfig} onLogout={handleLogout}>
                                                <AuthenticationProvider store={authenticationValue}>
                                                    <CacheProvider cache={cache}>
                                                        <NotificationsChildren />
                                                        <ErrorBoundary component={<StandardErrorPage />}>
                                                            {isLogout ? null : (
                                                                <Setup UID={UID} onLogin={handleLogin} />
                                                            )}
                                                        </ErrorBoundary>
                                                    </CacheProvider>
                                                </AuthenticationProvider>
                                            </ApiProvider>
                                        </ModalsProvider>
                                    </NotificationsHijack>
                                </PreventLeaveProvider>
                            </Router>
                        </ThemeProvider>
                    </Fragment>
                </RightToLeftProvider>
            </CompatibilityCheck>
        </ConfigProvider>
    );
};

export default App;
