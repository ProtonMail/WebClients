import { Fragment, useMemo, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

import * as bootstrap from '@proton/account/bootstrap';
import {
    AuthenticationProvider,
    CacheProvider,
    ConfigProvider,
    CreateNotificationOptions,
    ErrorBoundary,
    Icons,
    ModalsProvider,
    NotificationsHijack,
    NotificationsProvider,
    PreventLeaveProvider,
    RightToLeftProvider,
    StandardErrorPage,
    ThemeProvider,
} from '@proton/components';
import useInstance from '@proton/hooks/useInstance';
import metrics from '@proton/metrics';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import createApi from '@proton/shared/lib/api/createApi';
import { APPS } from '@proton/shared/lib/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import * as sentry from '@proton/shared/lib/helpers/sentry';
import { getRedirect } from '@proton/shared/lib/subscription/redirect';
import noop from '@proton/utils/noop';

import * as defaultConfig from '../app/config';
import locales from '../app/locales';
import { extendStore, setupStore } from '../app/store/store';
import MainContainer from './MainContainer';
import Setup from './Setup';
import broadcast, { MessageType } from './broadcast';
import { SupportedActions, getApp } from './helper';

const bootstrapApp = () => {
    const config = {
        ...defaultConfig,
        APP_NAME: APPS.PROTONACCOUNTLITE,
    };
    const api = createApi({ config, sendLocaleHeaders: true });
    const authentication = bootstrap.createAuthentication({ mode: 'standalone' });
    bootstrap.init({ config, authentication, locales });
    initSafariFontFixClassnames();

    const cache = createCache<string, any>();
    const store = setupStore({ mode: 'lite' });

    extendStore({ api, config, authentication });

    return {
        api,
        config,
        store,
        cache,
        authentication,
    };
};

const App = () => {
    const { api, config, store, authentication, cache } = useInstance(bootstrapApp);

    const [UID, setUID] = useState<string | undefined>(() => authentication.UID);
    const [isLogout, setLogout] = useState(false);

    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get('action') as SupportedActions | null;
    const client = searchParams.get('client');

    const defaultValues =
        {
            macOS: {
                redirect: 'protonvpn://refresh',
            },
        }[client || ''] || {};

    const redirect = getRedirect(searchParams.get('redirect') || defaultValues.redirect || undefined);
    const app = getApp(searchParams.get('app'), redirect);

    const handleLogin = (UID: string) => {
        authentication.setUID(UID);
        sentry.setUID(UID);
        metrics.setAuthHeaders(UID || '');
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
            ...authentication,
            logout: handleLogout,
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
        <ProtonStoreProvider store={store}>
            <ConfigProvider config={config}>
                <Icons />
                <RightToLeftProvider>
                    <Fragment key={UID}>
                        <ThemeProvider appName={config.APP_NAME}>
                            <BrowserRouter>
                                <PreventLeaveProvider>
                                    <NotificationsProvider>
                                        <NotificationsHijack
                                            onCreate={
                                                redirect || action === SupportedActions.SubscribeAccountLink
                                                    ? undefined
                                                    : handleNotificationCreate
                                            }
                                        >
                                            <ModalsProvider>
                                                <AuthenticationProvider store={authenticationValue}>
                                                    <CacheProvider cache={cache}>
                                                        <ErrorBoundary big component={<StandardErrorPage big />}>
                                                            {isLogout ? null : (
                                                                <Setup api={api} UID={UID} onLogin={handleLogin}>
                                                                    <MainContainer
                                                                        action={action}
                                                                        redirect={redirect}
                                                                        app={app}
                                                                        searchParams={searchParams}
                                                                    />
                                                                </Setup>
                                                            )}
                                                        </ErrorBoundary>
                                                    </CacheProvider>
                                                </AuthenticationProvider>
                                            </ModalsProvider>
                                        </NotificationsHijack>
                                    </NotificationsProvider>
                                </PreventLeaveProvider>
                            </BrowserRouter>
                        </ThemeProvider>
                    </Fragment>
                </RightToLeftProvider>
            </ConfigProvider>
        </ProtonStoreProvider>
    );
};

export default App;
