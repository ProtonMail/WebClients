import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Router } from 'react-router-dom';

import type { ProtonThunkArguments } from 'packages/redux-shared-store-types';

import {
    ApiProvider,
    AuthenticationProvider,
    ErrorBoundary,
    EventManagerProvider,
    LoaderPage,
    StandardErrorPage,
    StandardLoadErrorPage,
    StandardPrivateApp,
    useNotifications,
} from '@proton/components';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { FlagProvider } from '@proton/unleash';

import { bootstrapApp } from '../boostrap';
import * as config from '../config';
import type { MeetStore } from '../store';

type ExtraThunkArguments = Omit<ProtonThunkArguments, 'config'>;

export const ProviderContainer = ({ children }: { children: ReactNode }) => {
    const [initialised, setInitialised] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const notificationsManager = useNotifications();

    const storeRef = useRef<MeetStore>();

    const extraThunkArgumentsRef = useRef<ExtraThunkArguments>();

    const initialiseServicesAndStore = async () => {
        try {
            const { store, authentication, unleashClient, eventManager, api, history } = await bootstrapApp({
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

            setInitialised(true);
        } catch (error) {
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
                                <ErrorBoundary big component={<StandardErrorPage big />}>
                                    <StandardPrivateApp>{children}</StandardPrivateApp>
                                </ErrorBoundary>
                            </ApiProvider>
                        </Router>
                    </EventManagerProvider>
                </FlagProvider>
            </AuthenticationProvider>
        </ProtonStoreProvider>
    );
};
