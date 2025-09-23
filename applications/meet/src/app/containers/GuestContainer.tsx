import { useEffect, useRef, useState } from 'react';
import { Router } from 'react-router-dom';

import type { App } from '@proton-meet/proton-meet-core';
import type { ProtonThunkArguments } from 'packages/redux-shared-store-types';

import { ApiContext } from '@proton/components';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import { ProtonStoreProvider } from '@proton/redux-shared-store/index';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { FlagProvider } from '@proton/unleash';

import { bootstrapGuestApp } from '../bootstrap';
import config from '../config';
import { WasmContext } from '../contexts/WasmContext';
import type { MeetStore } from '../store/store';

type ExtraThunkArguments = Omit<ProtonThunkArguments, 'config' | 'api' | 'eventManager' | 'notificationsManager'> & {
    unauthenticatedApi: UnauthenticatedApi;
};

interface GuestContainerProps {
    children: React.ReactNode;
}

export const GuestContainer = ({ children }: GuestContainerProps) => {
    const [initialised, setInitialised] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const storeRef = useRef<MeetStore>();

    const extraThunkArgumentsRef = useRef<ExtraThunkArguments>();
    const wasmAppRef = useRef<App | null>(null);

    const initialiseServicesAndStore = async () => {
        try {
            const { store, authentication, unleashClient, unauthenticatedApi, history, wasmApp } =
                await bootstrapGuestApp(config);

            storeRef.current = store;

            extraThunkArgumentsRef.current = {
                authentication,
                unleashClient,
                unauthenticatedApi,
                history,
            };

            wasmAppRef.current = wasmApp;

            setInitialised(true);
        } catch (error) {
            captureMessage('Error initializing guest services and store', { level: 'error', extra: { error } });
            setError(getNonEmptyErrorMessage(error));
        }
    };

    useEffect(() => {
        void initialiseServicesAndStore();
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error} />;
    }

    if (!initialised) {
        return <LoaderPage />;
    }

    const { unauthenticatedApi, authentication, unleashClient, history } =
        extraThunkArgumentsRef.current as ExtraThunkArguments;

    return (
        <ProtonStoreProvider store={storeRef.current as MeetStore}>
            <AuthenticationProvider store={authentication}>
                <Router history={history}>
                    <FlagProvider unleashClient={unleashClient} startClient={false}>
                        <ApiContext.Provider value={unauthenticatedApi.apiCallback}>
                            <WasmContext.Provider value={{ wasmApp: wasmAppRef.current }}>
                                <ErrorBoundary big component={<StandardErrorPage big />}>
                                    {children}
                                </ErrorBoundary>
                            </WasmContext.Provider>
                        </ApiContext.Provider>
                    </FlagProvider>
                </Router>
            </AuthenticationProvider>
        </ProtonStoreProvider>
    );
};
