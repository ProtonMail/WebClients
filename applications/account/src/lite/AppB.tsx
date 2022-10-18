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
    PreventLeaveProvider,
    RightToLeftProvider,
    StandardErrorPage,
    ThemeProvider,
    getSessionTrackingEnabled,
} from '@proton/components';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import authentication from '@proton/shared/lib/authentication/authentication';
import { APPS } from '@proton/shared/lib/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import sentry from '@proton/shared/lib/helpers/sentry';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import noop from '@proton/utils/noop';

import * as config from '../app/config';
import Setup from './Setup';
import broadcast, { MessageType } from './broadcast';

initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

const enhancedConfig = {
    ...config,
    APP_NAME: APPS.PROTONACCOUNTLITE,
};

sentry({ config, uid: authentication.getUID(), sessionTracking: getSessionTrackingEnabled() });

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
                                                        <FeaturesProvider>
                                                            <ExperimentsProvider>
                                                                <NotificationsChildren />
                                                                <ErrorBoundary component={<StandardErrorPage />}>
                                                                    {isLogout ? null : (
                                                                        <Setup UID={UID} onLogin={handleLogin} />
                                                                    )}
                                                                </ErrorBoundary>
                                                            </ExperimentsProvider>
                                                        </FeaturesProvider>
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
