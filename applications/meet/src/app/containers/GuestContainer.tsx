import { useEffect, useRef, useState } from 'react';
import { Router } from 'react-router-dom';

import type { ProtonThunkArguments } from 'packages/redux-shared-store-types';

import {
    AuthenticationProvider,
    ErrorBoundary,
    LoaderPage,
    StandardErrorPage,
    StandardLoadErrorPage,
    UnauthenticatedApiProvider,
} from '@proton/components';
import { ProtonStoreProvider } from '@proton/redux-shared-store/index';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { FlagProvider } from '@proton/unleash/index';

import { bootstrapGuestApp } from '../boostrap';
import * as config from '../config';
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

    const initialiseServicesAndStore = async () => {
        try {
            const { store, authentication, unleashClient, unauthenticatedApi, history } =
                await bootstrapGuestApp(config);

            storeRef.current = store;

            extraThunkArgumentsRef.current = {
                authentication,
                unleashClient,
                unauthenticatedApi,
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

    const { unauthenticatedApi, authentication, unleashClient, history } =
        extraThunkArgumentsRef.current as ExtraThunkArguments;

    return (
        <ProtonStoreProvider store={storeRef.current as MeetStore}>
            <AuthenticationProvider store={authentication}>
                <Router history={history}>
                    <FlagProvider unleashClient={unleashClient} startClient={false}>
                        <UnauthenticatedApiProvider unauthenticatedApi={unauthenticatedApi}>
                            <ErrorBoundary big component={<StandardErrorPage big />}>
                                {children}
                            </ErrorBoundary>
                        </UnauthenticatedApiProvider>
                    </FlagProvider>
                </Router>
            </AuthenticationProvider>
        </ProtonStoreProvider>
    );
};
