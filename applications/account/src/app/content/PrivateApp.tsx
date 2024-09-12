import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Router } from 'react-router-dom';

import {
    AccountSpotlightsProvider,
    AuthenticationProvider,
    CalendarModelEventManagerProvider,
    ErrorBoundary,
    ProtonApp,
    StandardErrorPage,
} from '@proton/components';
import ApiProvider from '@proton/components/containers/api/ApiProvider';
import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import StandardPrivateApp from '@proton/components/containers/app/StandardPrivateApp';
import EventManagerProvider from '@proton/components/containers/eventManager/EventManagerProvider';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { FlagProvider } from '@proton/unleash';

import * as config from '../config';
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
                            <ApiProvider api={extraThunkArguments.api}>
                                <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                                    <Router history={extraThunkArguments.history}>
                                        <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                                            <CalendarModelEventManagerProvider
                                                calendarModelEventManager={
                                                    extraThunkArguments.calendarModelEventManager
                                                }
                                            >
                                                <AccountSpotlightsProvider>
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
                                                </AccountSpotlightsProvider>
                                            </CalendarModelEventManagerProvider>
                                        </EventManagerProvider>
                                    </Router>
                                </FlagProvider>
                            </ApiProvider>
                        </AuthenticationProvider>
                    </ProtonStoreProvider>
                );
            })()}
        </ProtonApp>
    );
};

export default PrivateApp;
