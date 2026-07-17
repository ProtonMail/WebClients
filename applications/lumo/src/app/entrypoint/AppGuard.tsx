import { Suspense, lazy, useMemo } from 'react';

import { c } from 'ttag';

import TextLoader from '@proton/components/components/loader/TextLoader';

import { LUMO_APP_NAME } from '../constants';

import { LUMO_ROUTES, isPublicPathname } from './lumoRoutes';

export { LUMO_ROUTES } from './lumoRoutes';

const determineRouteType = (pathname: string): 'private' | 'public' => {
    return isPublicPathname(pathname) ? 'public' : 'private';
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

    // NOTE: the native "app loaded" signal is intentionally NOT sent from here. AppGuard mounts
    // before the lazy-loaded app chunks (and the real composer) render, so signalling here would
    // dismiss the native loading placeholder too early and reveal a blank web view on slow
    // networks. The signal is sent from the composer's mount instead (see ComposerComponent).

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
