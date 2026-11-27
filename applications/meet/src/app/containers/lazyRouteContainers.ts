import { lazy } from 'react';

import { getIsGuestFromUrl } from '@proton/meet/store/slices/userSlice';
import noop from '@proton/utils/noop';

import { getEntryRoute } from '../utils/getEntryRoute';

export const loadDashboardContainer = () =>
    import(/* webpackChunkName: "DashboardContainer" */ './DashboardContainer/DashboardContainer');

export const loadGuestDashboardContainer = () =>
    import(/* webpackChunkName: "GuestDashboardContainer" */ './DashboardContainer/GuestDashboardContainer');

export const loadJoinContainer = () =>
    import(/* webpackChunkName: "WrappedProtonMeetContainer" */ './ProtonMeetContainer/WrappedProtonMeetContainer');

export const loadManageRecordingsContainer = () =>
    import(/* webpackChunkName: "ManageRecordingsContainer" */ './ManageRecordingsContainer/ManageRecordingsContainer');

export const LazyDashboardContainer = lazy(() =>
    loadDashboardContainer().then(({ DashboardContainer }) => ({ default: DashboardContainer }))
);

export const LazyGuestDashboardContainer = lazy(() =>
    loadGuestDashboardContainer().then(({ GuestDashboardContainer }) => ({ default: GuestDashboardContainer }))
);

export const LazyWrappedProtonMeetContainer = lazy(() =>
    loadJoinContainer().then(({ WrappedProtonMeetContainer }) => ({ default: WrappedProtonMeetContainer }))
);

export const LazyManageRecordingsContainer = lazy(() =>
    loadManageRecordingsContainer().then(({ ManageRecordingsContainer }) => ({ default: ManageRecordingsContainer }))
);

/** The container the app renders first on this pathname, after the redirects in App.tsx. */
export const getEntryRouteContainerLoader = (pathname: string, isGuest: boolean) => {
    const entryRoute = getEntryRoute(pathname);

    switch (entryRoute) {
        case 'join':
            return loadJoinContainer;
        case 'start-free-meeting':
            return isGuest ? loadJoinContainer : loadDashboardContainer;
        case 'manage-recordings':
            return isGuest ? loadGuestDashboardContainer : loadManageRecordingsContainer;
        case 'dashboard':
            return isGuest ? loadGuestDashboardContainer : loadDashboardContainer;
        default: {
            const unhandledEntryRoute: never = entryRoute;
            return unhandledEntryRoute;
        }
    }
};

export const loadEntryRouteContainer = () =>
    getEntryRouteContainerLoader(window.location.pathname, getIsGuestFromUrl())();

/** Loads every container App.tsx routes to, so in-app navigation does not wait on a chunk. */
export const preloadRouteContainersWhenIdle = (isGuest: boolean) => {
    const loaders = isGuest
        ? [loadGuestDashboardContainer, loadJoinContainer]
        : [loadDashboardContainer, loadManageRecordingsContainer, loadJoinContainer];

    const preload = () => {
        for (const load of loaders) {
            load().catch(noop);
        }
    };

    if (globalThis.requestIdleCallback) {
        globalThis.requestIdleCallback(preload);
    } else {
        setTimeout(preload);
    }
};
