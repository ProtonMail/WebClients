import { type ComponentType, Suspense, createElement } from 'react';
import { Route, Router } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import {
    getEntryRouteContainerLoader,
    loadDashboardContainer,
    loadGuestDashboardContainer,
    loadJoinContainer,
    loadManageRecordingsContainer,
} from './lazyRouteContainers';

const loadedModules = new Set<string>();

const importFreshModule = () => {
    vi.resetModules();
    loadedModules.clear();
    vi.doMock('./DashboardContainer/DashboardContainer', () => {
        loadedModules.add('dashboard');
        return { DashboardContainer: () => 'dashboard' };
    });
    vi.doMock('./DashboardContainer/GuestDashboardContainer', () => {
        loadedModules.add('guest dashboard');
        return { GuestDashboardContainer: () => 'guest dashboard' };
    });
    vi.doMock('./ManageRecordingsContainer/ManageRecordingsContainer', () => {
        loadedModules.add('manage recordings');
        return { ManageRecordingsContainer: () => 'manage recordings' };
    });
    vi.doMock('./ProtonMeetContainer/WrappedProtonMeetContainer', () => {
        loadedModules.add('join');
        return { WrappedProtonMeetContainer: () => 'join' };
    });
    return import('./lazyRouteContainers');
};

describe('getEntryRouteContainerLoader', () => {
    it.each([
        ['/u/0/join/id-abc123', false, loadJoinContainer],
        ['/guest/join/id-abc123', true, loadJoinContainer],
        ['/u/0/start-free-meeting', false, loadDashboardContainer],
        ['/guest/start-free-meeting', true, loadJoinContainer],
        ['/u/0/manage-recordings', false, loadManageRecordingsContainer],
        ['/u/0/dashboard', false, loadDashboardContainer],
        ['/guest/dashboard', true, loadGuestDashboardContainer],
        ['/', false, loadDashboardContainer],
    ])('loads the container of %s (guest: %s)', (pathname, isGuest, expectedLoader) => {
        expect(getEntryRouteContainerLoader(pathname, isGuest)).toBe(expectedLoader);
    });
});

describe('preloadRouteContainersWhenIdle', () => {
    beforeEach(() => {
        vi.stubGlobal('requestIdleCallback', (callback: () => void) => callback());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('loads every signed-in route container', async () => {
        const { preloadRouteContainersWhenIdle } = await importFreshModule();
        preloadRouteContainersWhenIdle(false);
        await vi.dynamicImportSettled();

        expect(loadedModules).toEqual(new Set(['dashboard', 'manage recordings', 'join']));
    });

    it('loads every guest route container, and not the signed-in ones', async () => {
        const { preloadRouteContainersWhenIdle } = await importFreshModule();
        preloadRouteContainersWhenIdle(true);
        await vi.dynamicImportSettled();

        expect(loadedModules).toEqual(new Set(['guest dashboard', 'join']));
    });
});

const renderRoute = (JoinRoute: ComponentType) => {
    const history = createMemoryHistory({ initialEntries: ['/join'] });
    render(
        createElement(
            Router,
            { history },
            createElement(
                Suspense,
                { fallback: 'loading' },
                createElement(Route, { path: '/join', component: JoinRoute })
            )
        )
    );
};

it('renders a route container once its chunk loaded', async () => {
    const { LazyWrappedProtonMeetContainer } = await importFreshModule();

    renderRoute(LazyWrappedProtonMeetContainer);

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(await screen.findByText('join')).toBeInTheDocument();
});
