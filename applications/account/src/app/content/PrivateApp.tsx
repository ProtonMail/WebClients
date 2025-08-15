import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Router } from 'react-router-dom';

import {
    ApiProvider,
    AuthenticationProvider,
    CalendarModelEventManagerProvider,
    ErrorBoundary,
    EventManagerProvider,
    ProtonApp,
    StandardErrorPage,
    StandardLoadErrorPage,
} from '@proton/components';
import { EventManagerV6Provider } from '@proton/components/containers/eventManager/EventManagerV6Provider';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { FlagProvider } from '@proton/unleash';

import config from '../config';
import type { AccountStore } from '../store/store';
import { extraThunkArguments } from '../store/thunk';
import AccountLoaderPage from './AccountLoaderPage';
import { bootstrapApp } from './bootstrap';

const defaultState: {
    error?: { message: string } | undefined;
    MainContainer?: FunctionComponent;
    store?: AccountStore;
} = { error: undefined };

const PrivateApp = () => {
    const [state, setState] = useState(defaultState);

    useEffectOnce(() => {
        (async () => {
            try {
                const result = await bootstrapApp({ config });
                setState({ store: result.store, MainContainer: result.MainContainer, error: undefined });
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
                const loader = <AccountLoaderPage />;
                if (!state.MainContainer || !state.store) {
                    return loader;
                }

                return (
                    <ProtonStoreProvider store={state.store}>
                        <AuthenticationProvider store={extraThunkArguments.authentication}>
                            <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                                <Router history={extraThunkArguments.history}>
                                    <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                                        <EventManagerV6Provider
                                            coreEventV6Manager={extraThunkArguments.coreEventV6Manager}
                                            mailEventV6Manager={extraThunkArguments.mailEventV6Manager}
                                            contactEventV6Manager={extraThunkArguments.contactEventV6Manager}
                                            calendarEventV6Manager={extraThunkArguments.calendarEventV6Manager}
                                        >
                                            <CalendarModelEventManagerProvider
                                                calendarModelEventManager={
                                                    extraThunkArguments.calendarModelEventManager
                                                }
                                            >
                                                <ApiProvider api={extraThunkArguments.api}>
                                                    <ErrorBoundary big component={<StandardErrorPage big />}>
                                                        <state.MainContainer />
                                                    </ErrorBoundary>
                                                </ApiProvider>
                                            </CalendarModelEventManagerProvider>
                                        </EventManagerV6Provider>
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

export default PrivateApp;
