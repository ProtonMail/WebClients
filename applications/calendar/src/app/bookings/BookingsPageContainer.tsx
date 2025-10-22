import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

import type { ProtonThunkArguments } from 'packages/redux-shared-store-types';

import ApiProvider from '@proton/components/containers/api/ApiProvider';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import ProtonApp from '@proton/components/containers/app/ProtonApp';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import ThemeProvider from '@proton/components/containers/themes/ThemeProvider';
import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { FlagProvider } from '@proton/unleash';

import config from '../config';
import type { BookingsStore } from '../store/bookingsStore';
import { BookingsRouter } from './BookingsRouter';
import { bootstrapBooking } from './bootstrapBooking';

type ExtraThunkArguments = Omit<
    ProtonThunkArguments,
    'config' | 'eventManager' | 'notificationsManager' | 'history'
> & {
    unauthenticatedApi: UnauthenticatedApi;
};

export const BookingPageContainer = ({ children }: PropsWithChildren) => {
    const [initialised, setInitialised] = useState(false);
    const extraThunkArgumentsRef = useRef<ExtraThunkArguments>();

    const storeRef = useRef<BookingsStore>();

    const initializeServices = async () => {
        const { unauthenticatedApi, unleashClient, authentication, api, store } = await bootstrapBooking();
        extraThunkArgumentsRef.current = {
            unauthenticatedApi,
            unleashClient,
            authentication,
            api,
        };

        storeRef.current = store;

        setInitialised(true);
    };

    useEffect(() => {
        void initializeServices();
    }, []);

    if (!initialised || !extraThunkArgumentsRef.current) {
        return <LoaderPage />;
    }

    const { api, unleashClient, authentication } = extraThunkArgumentsRef.current;

    return (
        <ProtonStoreProvider store={storeRef.current as BookingsStore}>
            <AuthenticationProvider store={authentication}>
                <BrowserRouter basename="/bookings">
                    <FlagProvider unleashClient={unleashClient} startClient={false}>
                        <ApiProvider api={api}>
                            <ThemeProvider appName={config.APP_NAME}>
                                <ErrorBoundary big component={<StandardErrorPage big />}>
                                    {children}
                                </ErrorBoundary>
                            </ThemeProvider>
                        </ApiProvider>
                    </FlagProvider>
                </BrowserRouter>
            </AuthenticationProvider>
        </ProtonStoreProvider>
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
