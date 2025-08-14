import { useEffect, useMemo } from 'react';

import AuthApp from './auth/AuthApp';
import GuestApp from './guest/GuestApp';
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

const AppGuard = () => {
    const routeType = useMemo(() => determineRouteType(window.location.pathname), [window.location.pathname]);

    // Notify mobile apps that the Lumo application is fully loaded
    // This runs once when AppGuard mounts, avoiding duplicate notifications
    useEffect(() => {
        notifyMobileAppLoaded(150); // 150ms delay to ensure loading is complete
    }, []);

    if (routeType === 'private') {
        return <AuthApp />;
    }

    return <GuestApp />;
};

export default AppGuard;
