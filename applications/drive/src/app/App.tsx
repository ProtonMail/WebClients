import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Router } from 'react-router-dom';

import {
    ApiProvider,
    AuthenticationProvider,
    DelinquentContainer,
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

import { bootstrapApp } from './bootstrap';
import * as config from './config';
import type { DriveStore } from './redux-store/store';
import { extraThunkArguments } from './redux-store/thunk';
import { UserSettingsProvider } from './store';
import { logPerformanceMarker } from './utils/performance';
import { Features, measureFeaturePerformance } from './utils/telemetry';

const defaultState: {
    initialUser?: UserModel;
    initialDriveUserSettings?: UserSettingsResponse;
    error?: { message: string } | undefined;
    showDrawerSidebar?: boolean;
    MainContainer?: FunctionComponent;
    store?: DriveStore;
} = {
    initialUser: undefined,
    initialDriveUserSettings: undefined,
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
                const { store, scopes, MainContainer, user, userSettings, driveUserSettings } = await bootstrapApp({
                    config,
                });
                // we have to pass the new api now it's extended by the bootstrap
                feature.end(undefined, extraThunkArguments.api);

                setState({
                    MainContainer: scopes.delinquent ? DelinquentContainer : MainContainer,
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
            } finally {
                feature.clear();
            }
        })().catch(noop);
    });

    return (
        <ProtonApp config={config}>
            {(() => {
                if (state.error) {
                    return <StandardLoadErrorPage errorMessage={state.error.message} />;
                }
                const loader = <LoaderPage />;
                if (!state.MainContainer || !state.store || !state.initialUser || !state.initialDriveUserSettings) {
                    return loader;
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
                                                    <StandardPrivateApp
                                                        hasReadableMemberKeyActivation
                                                        hasMemberKeyMigration
                                                        hasPrivateMemberKeyGeneration
                                                        noModals
                                                    >
                                                        <UserSettingsProvider
                                                            initialUser={state.initialUser}
                                                            initialDriveUserSettings={state.initialDriveUserSettings}
                                                        >
                                                            <state.MainContainer />
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
