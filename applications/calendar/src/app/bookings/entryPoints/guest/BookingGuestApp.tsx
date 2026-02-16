import { useEffect, useRef, useState } from 'react';
import { Router } from 'react-router-dom';

import ApiProvider from '@proton/components/containers/api/ApiProvider';
import ApiContext from '@proton/components/containers/api/apiContext';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import ProtonApp from '@proton/components/containers/app/ProtonApp';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import AuthenticationProvider from '@proton/components/containers/authentication/Provider';
import ModalsChildren from '@proton/components/containers/modals/Children';
import NotificationsChildren from '@proton/components/containers/notifications/Children';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { FlagProvider } from '@proton/unleash';

import config from '../../../config';
import { extraThunkArguments } from '../../../store/thunk';
import { BookingThemeProvider } from '../BookingsEntry';
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

    const { store, unauthenticatedApi } = bootstrapRef.current!;

    return (
        <ProtonApp config={config} ThemeProvider={BookingThemeProvider}>
            <ProtonStoreProvider store={store}>
                <AuthenticationProvider store={extraThunkArguments.authentication}>
                    <FlagProvider unleashClient={extraThunkArguments.unleashClient}>
                        <ApiProvider api={extraThunkArguments.api}>
                            <ApiContext.Provider value={unauthenticatedApi.apiCallback}>
                                <ErrorBoundary big component={<StandardErrorPage big />}>
                                    <NotificationsChildren />
                                    <ModalsChildren />
                                    <Router history={extraThunkArguments.history}>
                                        <BookingsRouter isGuest />
                                    </Router>
                                </ErrorBoundary>
                            </ApiContext.Provider>
                        </ApiProvider>
                    </FlagProvider>
                </AuthenticationProvider>
            </ProtonStoreProvider>
        </ProtonApp>
    );
};
