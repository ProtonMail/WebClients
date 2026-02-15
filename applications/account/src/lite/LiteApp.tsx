import type { ReactNode } from 'react';
import { Fragment, Suspense, lazy, useMemo, useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';

import * as bootstrap from '@proton/account/bootstrap';
import {
    AuthenticationProvider,
    CacheProvider,
    ConfigProvider,
    ErrorBoundary,
    ModalsProvider,
    NotificationsProvider,
    PreventLeaveProvider,
    RightToLeftProvider,
    StandardErrorPage,
    ThemeProvider,
} from '@proton/components';
import useInstance from '@proton/hooks/useInstance';
import Icons from '@proton/icons/Icons';
import metrics from '@proton/metrics';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import createApi from '@proton/shared/lib/api/createApi';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getValidatedProtonProtocolRedirect } from '@proton/shared/lib/authentication/fork/getValidatedProtonProtocol';
import { APPS } from '@proton/shared/lib/constants';
import { getAppVersionHeader } from '@proton/shared/lib/fetch/headers';
import createCache from '@proton/shared/lib/helpers/cache';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import * as sentry from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import defaultConfig from '../app/config';
import locales from '../app/locales';
import { extendStore, setupStore } from '../app/store/store';
import Setup from './Setup';
import broadcast, { MessageType } from './broadcast';
import LiteLayout from './components/LiteLayout';
import LiteLoaderPage from './components/LiteLoaderPage';
import { SupportedActions, getApp } from './helper';

const bootstrapApp = ({ appVersion, app }: { appVersion: string | null; app: ProductParam }) => {
    const defaultHeaders = appVersion ? getAppVersionHeader(appVersion) : undefined;
    const config = {
        ...defaultConfig,
        APP_NAME: APPS.PROTONACCOUNTLITE,
    };
    const api = createApi({
        config,
        defaultHeaders,
    });
    const authentication = bootstrap.createAuthentication({ mode: 'standalone' });
    bootstrap.init({ config, authentication, locales });
    initSafariFontFixClassnames();

    const cache = createCache<string, any>();
    const store = setupStore({
        mode: 'lite',
        preloadedState: {
            appName: app,
        },
    });

    extendStore({ api, config, authentication });

    return {
        api,
        config,
        store,
        cache,
        authentication,
    };
};

const LazyMainContainer = lazy(
    () =>
        import(
            /* webpackChunkName: "MainContainer" */
            /* webpackPrefetch: true */
            /* webpackPreload: true */
            /* webpackFetchPriority: "high" */
            './MainContainer'
        )
);

const App = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [initialSearchParams] = useState(() => {
        return new URLSearchParams(location.search);
    });
    const appVersion = searchParams.get('app-version');

    const [isLogout, setLogout] = useState(false);

    const action = searchParams.get('action') as SupportedActions | null;
    const client = searchParams.get('client');

    const defaultValues =
        {
            macOS: {
                redirect: 'protonvpn://refresh',
            },
        }[client || ''] || {};

    const redirect = getValidatedProtonProtocolRedirect(
        initialSearchParams.get('redirect') || defaultValues.redirect || undefined
    );
    const app = getApp({ app: initialSearchParams.get('app'), plan: initialSearchParams.get('plan'), redirect });

    const { api, config, store, authentication, cache } = useInstance(() => bootstrapApp({ appVersion, app }));

    const [UID, setUID] = useState<string | undefined>(() => authentication.UID);
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

    const layout = (children: ReactNode, props?: any) => {
        return (
            <LiteLayout searchParams={searchParams} {...props}>
                {children}
            </LiteLayout>
        );
    };

    const loader = layout(
        <LiteLoaderPage
            showProtonLogo={
                !!action && [SupportedActions.SubscribeAccount, SupportedActions.SubscribeAccountLink].includes(action)
            }
        />
    );

    return (
        <ProtonStoreProvider store={store}>
            <ConfigProvider config={config}>
                <Icons />
                <RightToLeftProvider>
                    <Fragment key={UID}>
                        <ThemeProvider appName={config.APP_NAME}>
                            <PreventLeaveProvider>
                                <NotificationsProvider>
                                    <ModalsProvider>
                                        <AuthenticationProvider store={authenticationValue}>
                                            <CacheProvider cache={cache}>
                                                <ErrorBoundary big component={<StandardErrorPage big />}>
                                                    {isLogout ? null : (
                                                        <Setup
                                                            api={api}
                                                            UID={UID}
                                                            onLogin={handleLogin}
                                                            loader={loader}
                                                        >
                                                            <Suspense fallback={loader}>
                                                                <LazyMainContainer
                                                                    layout={layout}
                                                                    loader={loader}
                                                                    action={action}
                                                                    redirect={redirect}
                                                                    app={app}
                                                                    searchParams={searchParams}
                                                                />
                                                            </Suspense>
                                                        </Setup>
                                                    )}
                                                </ErrorBoundary>
                                            </CacheProvider>
                                        </AuthenticationProvider>
                                    </ModalsProvider>
                                </NotificationsProvider>
                            </PreventLeaveProvider>
                        </ThemeProvider>
                    </Fragment>
                </RightToLeftProvider>
            </ConfigProvider>
        </ProtonStoreProvider>
    );
};

const WrappedApp = () => {
    return (
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );
};

export default WrappedApp;
