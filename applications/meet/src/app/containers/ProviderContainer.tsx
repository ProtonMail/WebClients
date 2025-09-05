import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Router } from 'react-router-dom';

import type { App } from '@proton-meet/proton-meet-core';
import type { ProtonThunkArguments } from 'packages/redux-shared-store-types';

import ApiProvider from '@proton/components/containers/api/ApiProvider';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import StandardPrivateApp from '@proton/components/containers/app/StandardPrivateApp';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import EventManagerProvider from '@proton/components/containers/eventManager/EventManagerProvider';
import useNotifications from '@proton/components/hooks/useNotifications';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { FlagProvider } from '@proton/unleash';

import { bootstrapApp } from '../bootstrap';
import config from '../config';
import { WasmContext } from '../contexts/WasmContext';
import type { MeetStore } from '../store';

type ExtraThunkArguments = Omit<ProtonThunkArguments, 'config'>;

export const ProviderContainer = ({ children }: { children: ReactNode }) => {
    const [initialised, setInitialised] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const notificationsManager = useNotifications();

    const storeRef = useRef<MeetStore>();

    const extraThunkArgumentsRef = useRef<ExtraThunkArguments>();
    const wasmAppRef = useRef<App | null>(null);

    const initialiseServicesAndStore = async () => {
        try {
            const { store, authentication, unleashClient, eventManager, api, history, wasmApp } = await bootstrapApp({
                notificationsManager,
                config,
            });

            storeRef.current = store;

            extraThunkArgumentsRef.current = {
                authentication,
                unleashClient,
                eventManager,
                api,
                history,
            };

            wasmAppRef.current = wasmApp;

            setInitialised(true);
        } catch (error) {
            captureMessage('Error initializing provider services and store', { level: 'error', extra: { error } });
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

    const { authentication, unleashClient, eventManager, api, history } = extraThunkArgumentsRef.current as Omit<
        ProtonThunkArguments,
        'config'
    >;

    return (
        <ProtonStoreProvider store={storeRef.current as MeetStore}>
            <AuthenticationProvider store={authentication}>
                <FlagProvider unleashClient={unleashClient} startClient={false}>
                    <EventManagerProvider eventManager={eventManager}>
                        <Router history={history}>
                            <ApiProvider api={api}>
                                <WasmContext.Provider value={{ wasmApp: wasmAppRef.current }}>
                                    <ErrorBoundary big component={<StandardErrorPage big />}>
                                        <StandardPrivateApp>{children}</StandardPrivateApp>
                                    </ErrorBoundary>
                                </WasmContext.Provider>
                            </ApiProvider>
                        </Router>
                    </EventManagerProvider>
                </FlagProvider>
            </AuthenticationProvider>
        </ProtonStoreProvider>
    );
};
