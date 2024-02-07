import { FunctionComponent, useState } from 'react';
import { Router } from 'react-router-dom';

import FlagProvider from '@unleash/proxy-client-react';

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
import { DRAWER_VISIBILITY, UserModel } from '@proton/shared/lib/interfaces';
import { UserSettingsResponse } from '@proton/shared/lib/interfaces/drive/userSettings';

import { bootstrapApp } from './bootstrap';
import * as config from './config';
import { DriveStore } from './redux-store/store';
import { extraThunkArguments } from './redux-store/thunk';
import { UserSettingsProvider } from './store';

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

    useEffectOnce(() => {
        (async () => {
            try {
                const { store, scopes, MainContainer, user, userSettings, driveUserSettings } = await bootstrapApp({
                    config,
                });
                setState({
                    MainContainer: scopes.delinquent ? DelinquentContainer : MainContainer,
                    showDrawerSidebar: userSettings.HideSidePanel === DRAWER_VISIBILITY.SHOW,
                    initialDriveUserSettings: driveUserSettings,
                    initialUser: user,
                    store,
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
                const loader = <LoaderPage />;
                if (!state.MainContainer || !state.store || !state.initialUser || !state.initialDriveUserSettings) {
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
                                                    <StandardPrivateApp
                                                        hasReadableMemberKeyActivation
                                                        hasMemberKeyMigration
                                                        hasPrivateMemberKeyGeneration
                                                        noModals
                                                        loader={loader}
                                                    >
                                                        <UserSettingsProvider
                                                            initialUser={state.initialUser}
                                                            initialDriveUserSettings={state.initialDriveUserSettings}
                                                        >
                                                            <state.MainContainer />
                                                        </UserSettingsProvider>
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

export default App;
