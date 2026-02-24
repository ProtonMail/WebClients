import { Suspense, lazy, useState } from 'react';
import { Router } from 'react-router-dom';

import {
    ApiProvider,
    AuthenticationProvider,
    DrawerProvider,
    ErrorBoundary,
    EventManagerProvider,
    ProtonApp,
    StandardErrorPage,
    StandardLoadErrorPage,
    StandardPrivateApp,
} from '@proton/components';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import metrics from '@proton/metrics/index';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { FlagProvider } from '@proton/unleash';

import { bootstrapApp } from '../../bootstrap';
import LumoLoader from '../../components/Loading/LumoLoader';
import config from '../../config';
import locales from '../../locales';
import { LumoThemeProvider } from '../../providers';
import type { LumoStore } from '../../redux/store';
import { extraThunkArguments } from '../../redux/thunk';
import { IndexedDBConnectionMonitor } from '../../components/IndexedDBConnectionMonitor';

const RouterContainerLazy = lazy(
    () =>
        import(
            /* webpackChunkName: "RouterContainer" */
            /* webpackFetchPriority: "high" */
            './RouterContainer'
        )
);

setTtagLocales(locales);
newVersionUpdater(config);

metrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);

const defaultState: {
    initialUser?: UserModel;
    store?: LumoStore;
    error?: { message: string } | undefined;
    showDrawerSidebar?: boolean;
} = {
    error: undefined,
    showDrawerSidebar: false,
};

const AuthApp = () => {
    const [state, setState] = useState(defaultState);

    useEffectOnce(() => {
        void (async () => {
            try {
                const result = await bootstrapApp({
                    config,
                });

                // Handle the case where bootstrapApp returns void (redirects to guest)
                if (!result) {
                    return;
                }

                const { user, userSettings, store } = result;

                setState({
                    store,
                    showDrawerSidebar: userSettings.HideSidePanel === DRAWER_VISIBILITY.SHOW,
                    initialUser: user,
                });
            } catch (error: any) {
                setState({
                    error: {
                        message: getNonEmptyErrorMessage(error),
                    },
                });
            }
        })();
    });

    return (
        <ProtonApp config={config}>
            {(() => {
                if (state.error) {
                    return <StandardLoadErrorPage errorMessage={state.error.message} />;
                }

                const loader = <LumoLoader />;
                if (!state.store || !state.initialUser) {
                    return loader;
                }

                return (
                    <ProtonStoreProvider store={state.store}>
                        <AuthenticationProvider store={extraThunkArguments.authentication}>
                            <ApiProvider api={extraThunkArguments.api}>
                                <DrawerProvider defaultShowDrawerSidear={state.showDrawerSidebar}>
                                    <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                                        <Router history={extraThunkArguments.history}>
                                            <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                                                <ErrorBoundary big component={<StandardErrorPage big />}>
                                                    <IndexedDBConnectionMonitor />
                                                    <StandardPrivateApp>
                                                        <LumoThemeProvider>
                                                            <Suspense fallback={loader}>
                                                                <RouterContainerLazy />
                                                            </Suspense>
                                                        </LumoThemeProvider>
                                                    </StandardPrivateApp>
                                                </ErrorBoundary>
                                            </EventManagerProvider>
                                        </Router>
                                    </FlagProvider>
                                </DrawerProvider>
                            </ApiProvider>
                        </AuthenticationProvider>
                    </ProtonStoreProvider>
                );
            })()}
        </ProtonApp>
    );
};

export default AuthApp;
