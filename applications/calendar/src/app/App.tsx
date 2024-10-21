import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Router } from 'react-router-dom';

import {
    ApiProvider,
    AuthenticationProvider,
    CalendarModelEventManagerProvider,
    DelinquentContainer,
    DrawerProvider,
    ErrorBoundary,
    EventManagerProvider,
    LoaderPage,
    ProtonApp,
    StandardErrorPage,
    StandardLoadErrorPage,
    StandardPrivateApp,
    SubscriptionModalProvider,
} from '@proton/components';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { APPS } from '@proton/shared/lib/constants';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { FlagProvider } from '@proton/unleash';

import { bootstrapApp } from './bootstrap';
import * as config from './config';
import type { CalendarStore } from './store/store';
import { extraThunkArguments } from './store/thunk';

const defaultState: {
    store?: CalendarStore;
    MainContainer?: FunctionComponent;
    error?: { message: string } | undefined;
    showDrawerSidebar?: boolean;
} = {
    error: undefined,
    showDrawerSidebar: false,
};

const App = () => {
    const [state, setState] = useState(defaultState);

    useEffectOnce(() => {
        (async () => {
            try {
                const { MainContainer, scopes, userSettings, store } = await bootstrapApp({ config });
                setState({
                    MainContainer: scopes.delinquent ? DelinquentContainer : MainContainer,
                    store,
                    showDrawerSidebar: userSettings.HideSidePanel === DRAWER_VISIBILITY.SHOW,
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
                if (!state.MainContainer || !state.store) {
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
                                                <SubscriptionModalProvider app={APPS.PROTONCALENDAR}>
                                                    <CalendarModelEventManagerProvider
                                                        calendarModelEventManager={
                                                            extraThunkArguments.calendarModelEventManager
                                                        }
                                                    >
                                                        <ErrorBoundary big component={<StandardErrorPage big />}>
                                                            <StandardPrivateApp
                                                                hasReadableMemberKeyActivation
                                                                hasMemberKeyMigration
                                                                hasPrivateMemberKeyGeneration
                                                                loader={loader}
                                                            >
                                                                <state.MainContainer />
                                                            </StandardPrivateApp>
                                                        </ErrorBoundary>
                                                    </CalendarModelEventManagerProvider>
                                                </SubscriptionModalProvider>
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
