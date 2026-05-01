import { Suspense, lazy, useState } from 'react';
import { Router } from 'react-router-dom';
import { CompatRouter } from 'react-router-dom-v5-compat';

import {
    ApiProvider,
    AuthenticationProvider,
    DrawerProvider,
    ErrorBoundary,
    EventManagerProvider,
    LoaderPage,
    ProtonApp,
    StandardErrorPage,
    StandardLoadErrorPage,
    StandardPrivateApp,
} from '@proton/components';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { FlagProvider } from '@proton/unleash/proxy';
import noop from '@proton/utils/noop';

import { bootstrapApp } from './bootstrap';
import config from './config';
import { useUserSettingsStore } from './hooks/user';
import { driveMetrics } from './modules/metrics';
import { NotificationsBridge } from './modules/notifications';
import type { DriveStore } from './redux-store/store';
import { extraThunkArguments } from './redux-store/thunk';
import { sendErrorReport } from './utils/errorHandling';
import { getWebpackChunkFailedToLoadError } from './utils/errorHandling/WebpackChunkFailedToLoadError';
import { Features, measureFeaturePerformance } from './utils/telemetry';

const MainContainerLazy = lazy(() =>
    import(
        /* webpackChunkName: "MainContainer" */
        /* webpackPrefetch: true */
        /* webpackPreload: true */
        /* webpackFetchPriority: "high" */
        './containers/MainContainer'
    ).catch((e) => {
        const report = getWebpackChunkFailedToLoadError(e, 'MainContainer');
        console.warn(report);
        sendErrorReport(report);
        return Promise.reject(report);
    })
);

const defaultState: {
    error?: { message: string } | undefined;
    showDrawerSidebar?: boolean;
    store?: DriveStore;
} = {
    error: undefined,
    showDrawerSidebar: false,
};

const App = () => {
    const [state, setState] = useState(defaultState);
    const feature = measureFeaturePerformance(extraThunkArguments.api, Features.globalBootstrapApp);
    useEffectOnce(() => {
        (async () => {
            try {
                feature.start();
                const { store, user, userSettings, driveUserSettings } = await bootstrapApp({
                    config,
                });
                // we have to pass the new api now it's extended by the bootstrap
                feature.end(undefined, extraThunkArguments.api);

                useUserSettingsStore.getState().initialize(user, driveUserSettings);
                setState({
                    showDrawerSidebar: userSettings.HideSidePanel === DRAWER_VISIBILITY.SHOW,
                    store,
                });

                driveMetrics.drivePerformance.markPageLoad({ isPublic: false });
            } catch (error: any) {
                setState({
                    error: {
                        message: getNonEmptyErrorMessage(error),
                    },
                });
            } finally {
                feature.clear();
            }
        })().catch(noop);
    });

    return (
        <ProtonApp config={config}>
            <NotificationsBridge />
            {(() => {
                if (state.error) {
                    return <StandardLoadErrorPage errorMessage={state.error.message} />;
                }
                if (!state.store) {
                    return <LoaderPage />;
                }
                return (
                    <ProtonStoreProvider store={state.store}>
                        <AuthenticationProvider store={extraThunkArguments.authentication}>
                            <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                                <Router history={extraThunkArguments.history}>
                                    <CompatRouter>
                                        <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                                            <ApiProvider api={extraThunkArguments.api}>
                                                <DrawerProvider defaultShowDrawerSidebar={state.showDrawerSidebar}>
                                                    <ErrorBoundary
                                                        big
                                                        component={<StandardErrorPage big />}
                                                        onError={(error) => {
                                                            driveMetrics.globalErrors.markCrashError(error);
                                                        }}
                                                    >
                                                        <StandardPrivateApp noModals>
                                                            <Suspense fallback={<LoaderPage />}>
                                                                <MainContainerLazy />
                                                            </Suspense>
                                                        </StandardPrivateApp>
                                                    </ErrorBoundary>
                                                </DrawerProvider>
                                            </ApiProvider>
                                        </EventManagerProvider>
                                    </CompatRouter>
                                </Router>
                            </FlagProvider>
                        </AuthenticationProvider>
                    </ProtonStoreProvider>
                );
            })()}
        </ProtonApp>
    );
};

export default App;
