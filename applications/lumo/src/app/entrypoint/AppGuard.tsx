import { Suspense, lazy, useEffect, useMemo } from 'react';

import { c } from 'ttag';

import TextLoader from '@proton/components/components/loader/TextLoader';

import { LUMO_APP_NAME } from '../constants';
import { notifyMobileAppLoaded } from '../util/mobileAppNotification';

export const LUMO_ROUTES = {
    PRIVATE_ROUTES_PREFIX: '/u/',
    LOGIN_ROUTE: '/login',
    GUEST: '/guest',
};

const determineRouteType = (pathname: string): 'private' | 'public' => {
    if (pathname === LUMO_ROUTES.GUEST) {
        return 'public';
    }
    return 'private';
};

const AuthApp = lazy(
    () =>
        import(
            /* webpackChunkName: "AuthApp" */
            './auth/AuthApp'
        )
);

const GuestApp = lazy(
    () =>
        import(
            /* webpackChunkName: "GuestApp" */
            './guest/GuestApp'
        )
);

const AppGuard = () => {
    const routeType = useMemo(() => determineRouteType(window.location.pathname), [window.location.pathname]);

    const fallback = (
        <div className="absolute inset-center text-center">
            <TextLoader className="color-weak ml-5">{c('Loading').t`Loading ${LUMO_APP_NAME}`}</TextLoader>
        </div>
    );

    // Notify mobile apps that the Lumo application is fully loaded
    // This runs once when AppGuard mounts, avoiding duplicate notifications
    useEffect(() => {
        notifyMobileAppLoaded(150); // 150ms delay to ensure loading is complete
    }, []);

    if (routeType === 'private') {
        return (
            <Suspense fallback={fallback}>
                <AuthApp />
            </Suspense>
        );
    }

    return (
        <Suspense fallback={fallback}>
            <GuestApp />
        </Suspense>
    );
};

export default AppGuard;
