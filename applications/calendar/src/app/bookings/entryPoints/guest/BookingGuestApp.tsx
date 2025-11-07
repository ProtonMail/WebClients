import { useEffect, useRef, useState } from 'react';
import { Router } from 'react-router-dom';

import {
    ApiContext,
    AuthenticationProvider,
    ErrorBoundary,
    LoaderPage,
    ModalsChildren,
    NotificationsChildren,
    ProtonApp,
    StandardErrorPage,
    StandardLoadErrorPage,
} from '@proton/components';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { FlagProvider } from '@proton/unleash';

import config from '../../../config';
import { BookingsRouter } from '../BookingsRouter';
import type { BookingGuestBootstrapResult } from '../interface';
import { bookingGuestBootstrap } from './bookingGuestBootstrap';

export const BookingGuestApp = () => {
    const bootstrapRef = useRef<BookingGuestBootstrapResult>();

    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const bootstrap = await bookingGuestBootstrap();

                // Redirect authenticated users to auth booking page
                if (bootstrap === 'redirect') {
                    const hash = window.location.hash;
                    return replaceUrl(getAppHref(`/bookings/guest${hash}`, APPS.PROTONCALENDAR));
                }

                bootstrapRef.current = bootstrap;
                setInitialized(true);
            } catch (error) {
                setError(getNonEmptyErrorMessage(error));
            }
        };

        void initializeApp();
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error} />;
    }

    if (!initialized) {
        return (
            <ProtonApp config={config}>
                <LoaderPage />;
            </ProtonApp>
        );
    }

    const { store, unauthenticatedApi, unleashClient, authentication, history } = bootstrapRef.current!;

    return (
        <ProtonApp config={config}>
            <ProtonStoreProvider store={store}>
                <AuthenticationProvider store={authentication}>
                    <FlagProvider unleashClient={unleashClient}>
                        <ApiContext.Provider value={unauthenticatedApi.apiCallback}>
                            <ErrorBoundary big component={<StandardErrorPage big />}>
                                <NotificationsChildren />
                                <ModalsChildren />
                                <Router history={history}>
                                    <BookingsRouter isGuest />
                                </Router>
                            </ErrorBoundary>
                        </ApiContext.Provider>
                    </FlagProvider>
                </AuthenticationProvider>
            </ProtonStoreProvider>
        </ProtonApp>
    );
};
