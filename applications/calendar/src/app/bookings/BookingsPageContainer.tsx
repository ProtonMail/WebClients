import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Router } from 'react-router-dom';

import type { ProtonThunkArguments } from 'packages/redux-shared-store-types';

import LoaderPage from '@proton/components/containers/app/LoaderPage';
import ProtonApp from '@proton/components/containers/app/ProtonApp';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import ThemeProvider from '@proton/components/containers/themes/ThemeProvider';
import { ApiContext } from '@proton/components/index';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { FlagProvider } from '@proton/unleash';

import config from '../config';
import { BookingsRouter } from './BookingsRouter';
import { bootstrapBooking } from './bootstrapBooking';

type ExtraThunkArguments = Omit<ProtonThunkArguments, 'config' | 'api' | 'eventManager' | 'notificationsManager'> & {
    unauthenticatedApi: UnauthenticatedApi;
};

export const BookingPageContainer = ({ children }: PropsWithChildren) => {
    const [initialised, setInitialised] = useState(false);
    const extraThunkArgumentsRef = useRef<ExtraThunkArguments>();

    const initializeServices = () => {
        const { unauthenticatedApi, unleashClient, authentication, history } = bootstrapBooking();
        extraThunkArgumentsRef.current = {
            unauthenticatedApi,
            unleashClient,
            authentication,
            history,
        };

        setInitialised(true);
    };

    useEffect(() => {
        initializeServices();
    }, []);

    if (!initialised || !extraThunkArgumentsRef.current) {
        return <LoaderPage />;
    }

    const { unauthenticatedApi, unleashClient, authentication, history } = extraThunkArgumentsRef.current;

    return (
        <ThemeProvider appName={config.APP_NAME}>
            <AuthenticationProvider store={authentication}>
                <Router history={history}>
                    <FlagProvider unleashClient={unleashClient} startClient={false}>
                        <ApiContext.Provider value={unauthenticatedApi.apiCallback}>{children}</ApiContext.Provider>
                    </FlagProvider>
                </Router>
            </AuthenticationProvider>
        </ThemeProvider>
    );
};

export const BookingsApp = () => {
    return (
        <ProtonApp config={config}>
            <BookingPageContainer>
                <BookingsRouter />
            </BookingPageContainer>
        </ProtonApp>
    );
};
