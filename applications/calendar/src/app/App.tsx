import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Router } from 'react-router-dom';

import ApiProvider from '@proton/components/containers/api/ApiProvider';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import ProtonApp from '@proton/components/containers/app/ProtonApp';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import StandardPrivateApp from '@proton/components/containers/app/StandardPrivateApp';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import EventManagerProvider from '@proton/components/containers/eventManager/EventManagerProvider';
import CalendarModelEventManagerProvider from '@proton/components/containers/eventManager/calendar/CalendarModelEventManagerProvider';
import { DrawerProvider } from '@proton/components/hooks/drawer/useDrawer';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { FlagProvider } from '@proton/unleash';

import { bootstrapApp } from './bootstrap';
import config from './config';
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
        void (async () => {
            try {
                const { MainContainer, userSettings, store } = await bootstrapApp({ config });
                setState({
                    MainContainer,
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
                                                <CalendarModelEventManagerProvider
                                                    calendarModelEventManager={
                                                        extraThunkArguments.calendarModelEventManager
                                                    }
                                                >
                                                    <ErrorBoundary big component={<StandardErrorPage big />}>
                                                        <StandardPrivateApp>
                                                            <state.MainContainer />
                                                        </StandardPrivateApp>
                                                    </ErrorBoundary>
                                                </CalendarModelEventManagerProvider>
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
