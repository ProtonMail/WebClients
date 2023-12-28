import { FunctionComponent, useState } from 'react';
import { Router } from 'react-router-dom';

import FlagProvider from '@protontech/proxy-client-react';
import { c } from 'ttag';

import {
    AuthenticationProvider,
    CalendarModelEventManagerProvider,
    ErrorBoundary,
    ProtonApp,
    StandardErrorPage,
} from '@proton/components/containers';
import ApiProvider from '@proton/components/containers/api/ApiProvider';
import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import StandardPrivateApp from '@proton/components/containers/app/StandardPrivateApp';
import EventManagerProvider from '@proton/components/containers/eventManager/EventManagerProvider';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import * as config from '../config';
import { AccountStore } from '../store/store';
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
                        message: getApiErrorMessage(error) || error?.message || c('Error').t`Unknown error`,
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

                if (!state.MainContainer || !state.store) {
                    return <AccountLoaderPage />;
                }

                return (
                    <ProtonStoreProvider store={state.store}>
                        <AuthenticationProvider store={extraThunkArguments.authentication}>
                            <ApiProvider api={extraThunkArguments.api}>
                                <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                                    <Router history={extraThunkArguments.history}>
                                        <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                                            <ErrorBoundary big component={<StandardErrorPage big />}>
                                                <StandardPrivateApp
                                                    hasReadableMemberKeyActivation
                                                    hasMemberKeyMigration
                                                    hasPrivateMemberKeyGeneration
                                                >
                                                    <state.MainContainer />
                                                </StandardPrivateApp>
                                            </ErrorBoundary>
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
