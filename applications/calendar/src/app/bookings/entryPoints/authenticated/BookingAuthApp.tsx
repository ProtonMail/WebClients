import { useEffect, useRef, useState } from 'react';
import { Router } from 'react-router-dom';

import {
    ApiProvider,
    AuthenticationProvider,
    ErrorBoundary,
    LoaderPage,
    ModalsChildren,
    NotificationsChildren,
    ProtonApp,
    StandardErrorPage,
} from '@proton/components';
import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { FlagProvider } from '@proton/unleash';

import config from '../../../config';
import { BookingsRouter } from '../BookingsRouter';
import type { BookingAuthBootstrapResult } from '../interface';
import { bookingAuthBootstrap } from './bookingAuthBootstrap';

export const BookingAuthApp = () => {
    const [initialized, setInitialized] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const bootstrapRef = useRef<BookingAuthBootstrapResult>();

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const bootstrap = await bookingAuthBootstrap();
                // Redirect unauthenticated users to guest booking page
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

    const { store, api, unleashClient, authentication, history } = bootstrapRef.current!;

    return (
        <ProtonApp config={config}>
            <ProtonStoreProvider store={store}>
                <AuthenticationProvider store={authentication}>
                    <FlagProvider unleashClient={unleashClient}>
                        <ApiProvider api={api}>
                            <ErrorBoundary big component={<StandardErrorPage big />}>
                                <NotificationsChildren />
                                <ModalsChildren />
                                <Router history={history}>
                                    <BookingsRouter />
                                </Router>
                            </ErrorBoundary>
                        </ApiProvider>
                    </FlagProvider>
                </AuthenticationProvider>
            </ProtonStoreProvider>
        </ProtonApp>
    );
};
