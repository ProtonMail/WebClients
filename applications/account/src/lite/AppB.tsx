import { Fragment, useMemo, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
    ApiProvider,
    CacheProvider,
    CompatibilityCheck,
    ConfigProvider,
    CreateNotificationOptions,
    ErrorBoundary,
    ExperimentsProvider,
    FeaturesProvider,
    Icons,
    ModalsProvider,
    NotificationsChildren,
    NotificationsHijack,
    NotificationsProvider,
    PreventLeaveProvider,
    RightToLeftProvider,
    StandardErrorPage,
    ThemeProvider,
    UnleashFlagProvider,
    getSessionTrackingEnabled,
} from '@proton/components';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import metrics from '@proton/metrics';
import { getClientID } from '@proton/shared/lib/apps/helper';
import authentication from '@proton/shared/lib/authentication/authentication';
import { APPS } from '@proton/shared/lib/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import * as sentry from '@proton/shared/lib/helpers/sentry';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import { getRedirect } from '@proton/shared/lib/subscription/redirect';
import noop from '@proton/utils/noop';

import * as config from '../app/config';
import locales from '../app/locales';
import MainContainer from './MainContainer';
import Setup from './Setup';
import broadcast, { MessageType } from './broadcast';
import { SupportedActions, getApp } from './helper';

setTtagLocales(locales);

const enhancedConfig = {
    ...config,
    APP_NAME: APPS.PROTONACCOUNTLITE,
};

sentry.default({ config, uid: authentication.getUID(), sessionTracking: getSessionTrackingEnabled() });
metrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);

const cache = createCache<string, any>();

const App = () => {
    const [UID, setUID] = useState<string | undefined>(() => authentication.getUID());
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
        setUID(UID);
        sentry.setUID(UID);
        metrics.setAuthHeaders(UID || '');
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
                                    <NotificationsProvider>
                                        <NotificationsHijack
                                            onCreate={
                                                redirect || action === SupportedActions.SubscribeAccountLink
                                                    ? undefined
                                                    : handleNotificationCreate
                                            }
                                        >
                                            <ModalsProvider>
                                                <ApiProvider UID={UID} config={enhancedConfig} onLogout={handleLogout}>
                                                    <AuthenticationProvider store={authenticationValue}>
                                                        <CacheProvider cache={cache}>
                                                            <UnleashFlagProvider>
                                                                <FeaturesProvider>
                                                                    <ExperimentsProvider>
                                                                        <NotificationsChildren />
                                                                        <ErrorBoundary
                                                                            component={<StandardErrorPage big />}
                                                                        >
                                                                            {isLogout ? null : (
                                                                                <Setup UID={UID} onLogin={handleLogin}>
                                                                                    <MainContainer
                                                                                        action={action}
                                                                                        redirect={redirect}
                                                                                        app={app}
                                                                                        searchParams={searchParams}
                                                                                    />
                                                                                </Setup>
                                                                            )}
                                                                        </ErrorBoundary>
                                                                    </ExperimentsProvider>
                                                                </FeaturesProvider>
                                                            </UnleashFlagProvider>
                                                        </CacheProvider>
                                                    </AuthenticationProvider>
                                                </ApiProvider>
                                            </ModalsProvider>
                                        </NotificationsHijack>
                                    </NotificationsProvider>
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
