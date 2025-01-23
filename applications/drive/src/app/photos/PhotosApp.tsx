import { Suspense, lazy, useState } from 'react';
import { Router } from 'react-router-dom';

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
import type { UserModel } from '@proton/shared/lib/interfaces';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import type { UserSettingsResponse } from '@proton/shared/lib/interfaces/drive/userSettings';
import { FlagProvider } from '@proton/unleash';
import noop from '@proton/utils/noop';

import * as config from '../config';
import type { DriveStore } from '../redux-store/store';
import { extraThunkArguments } from '../redux-store/thunk';
import { UserSettingsProvider } from '../store';
import { sendErrorReport } from '../utils/errorHandling';
import { getWebpackChunkFailedToLoadError } from '../utils/errorHandling/WebpackChunkFailedToLoadError';
import { logPerformanceMarker } from '../utils/performance';
import { bootstrapPhotosApp } from './bootstrapPhotos';

const DelinquentContainerLazy = lazy(() =>
    import(/* webpackChunkName: "DelinquentContainer" */ '@proton/components/containers/app/DelinquentContainer').catch(
        (e) => {
            const report = getWebpackChunkFailedToLoadError(e, 'DelinquentContainer');
            console.warn(report);
            sendErrorReport(report);
            return Promise.reject(report);
        }
    )
);

const MainPhotosContainerLazy = lazy(() =>
    import(
        /* webpackChunkName: "MainPhotosContainer" */
        /* webpackPrefetch: true */
        /* webpackPreload: true */
        /* webpackFetchPriority: "high" */
        './PhotosWithAlbumsContainer'
    ).catch((e) => {
        const report = getWebpackChunkFailedToLoadError(e, 'MainPhotosContainer');
        console.warn(report);
        sendErrorReport(report);
        return Promise.reject(report);
    })
);

const defaultState: {
    initialUser?: UserModel;
    initialDriveUserSettings?: UserSettingsResponse;
    error?: { message: string } | undefined;
    showDrawerSidebar?: boolean;
    store?: DriveStore;
    delinquent?: boolean;
} = {
    initialUser: undefined,
    initialDriveUserSettings: undefined,
    error: undefined,
    showDrawerSidebar: false,
    delinquent: undefined,
};

const App = () => {
    const [state, setState] = useState(defaultState);

    useEffectOnce(() => {
        (async () => {
            try {
                const { store, scopes, user, userSettings, driveUserSettings } = await bootstrapPhotosApp({
                    config,
                });
                setState({
                    delinquent: scopes.delinquent,
                    showDrawerSidebar: userSettings.HideSidePanel === DRAWER_VISIBILITY.SHOW,
                    initialDriveUserSettings: driveUserSettings,
                    initialUser: user,
                    store,
                });
                logPerformanceMarker('drive_performance_clicktobootstrapped_histogram');
            } catch (error: any) {
                setState({
                    error: {
                        message: getNonEmptyErrorMessage(error),
                    },
                });
            }
        })().catch(noop);
    });

    return (
        <ProtonApp config={config}>
            {(() => {
                if (state.error) {
                    return <StandardLoadErrorPage errorMessage={state.error.message} />;
                }
                if (!state.store || !state.initialUser || !state.initialDriveUserSettings) {
                    return <LoaderPage />;
                }
                return (
                    <ProtonStoreProvider store={state.store}>
                        <AuthenticationProvider store={extraThunkArguments.authentication}>
                            <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                                <Router history={extraThunkArguments.history}>
                                    <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                                        <ApiProvider api={extraThunkArguments.api}>
                                            <DrawerProvider defaultShowDrawerSidear={state.showDrawerSidebar}>
                                                <ErrorBoundary big component={<StandardErrorPage big />}>
                                                    <StandardPrivateApp noModals>
                                                        <UserSettingsProvider
                                                            initialUser={state.initialUser}
                                                            initialDriveUserSettings={state.initialDriveUserSettings}
                                                        >
                                                            {typeof state.delinquent !== 'undefined' && (
                                                                <Suspense fallback={<LoaderPage />}>
                                                                    {state.delinquent === false && (
                                                                        <MainPhotosContainerLazy />
                                                                    )}
                                                                    {state.delinquent === true && (
                                                                        <DelinquentContainerLazy />
                                                                    )}
                                                                </Suspense>
                                                            )}
                                                        </UserSettingsProvider>
                                                    </StandardPrivateApp>
                                                </ErrorBoundary>
                                            </DrawerProvider>
                                        </ApiProvider>
                                    </EventManagerProvider>
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
