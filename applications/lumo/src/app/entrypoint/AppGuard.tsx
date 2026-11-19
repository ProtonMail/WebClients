import { Suspense, lazy, useEffect, useMemo } from 'react';

import LumoLoader, { LumoBootLoader } from '../components/Loading/LumoLoader';
import { deleteGuestGenerationRecovery } from '../indexedDb/generationRecoveryDb';
import { isPublicPathname } from './lumoRoutes';

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
    useEffect(() => {
        void deleteGuestGenerationRecovery().catch(() => {
            console.warn('[Generation recovery] Guest checkpoint cleanup is blocked or unavailable');
        });
    }, []);
    const routeType = useMemo(() => determineRouteType(window.location.pathname), [window.location.pathname]);

    // NOTE: the native "app loaded" signal is intentionally NOT sent from here. AppGuard mounts
    // before the lazy-loaded app chunks (and the real composer) render, so signalling here would
    // dismiss the native loading placeholder too early and reveal a blank web view on slow
    // networks. The signal is sent from the composer's mount instead (see ComposerComponent).

    return (
        <LumoBootLoader>
            <Suspense fallback={<LumoLoader />}>{routeType === 'private' ? <AuthApp /> : <GuestApp />}</Suspense>
        </LumoBootLoader>
    );
};

export default AppGuard;
