import { createRef } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import * as orgHooks from '@proton/account/organization/hooks';
import * as hooks from '@proton/account/user/hooks';
import * as helper from '@proton/components/containers/layout/helper';
import type { SectionConfig, SidebarConfig } from '@proton/components/index';
import type { SidebarTree } from '@proton/nav/types/sidebar';

import { VPNSidebar } from './VPNSidebar';

vi.mock('@proton/components/components/loader/Loader', () => ({
    __esModule: true,
    default: () => <progress data-testid="loader" aria-label="Loading…" />,
}));
vi.mock('@proton/components/components/sidebar/Sidebar', () => ({
    __esModule: true,
    default: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
}));
vi.mock('@proton/components/components/sidebar/SidebarList', () => ({
    __esModule: true,
    default: ({ children }: any) => <ul data-testid="sidebar-list">{children}</ul>,
}));
vi.mock('@proton/components/components/sidebar/SidebarNav', () => ({
    __esModule: true,
    default: ({ children }: any) => <nav data-testid="sidebar-nav">{children}</nav>,
}));

vi.mock('@proton/components/components/sidebar/SettingsListItem', () => ({
    __esModule: true,
    default: ({ children, to }: any) => <li data-testid={`item-${to}`}>{children}</li>,
}));

vi.mock('@proton/account/user/hooks');
vi.mock('@proton/account/organization/hooks');
vi.mock('@proton/vpn/components/Sidebar', () => ({
    FeedbackModal: () => <div data-testid="feedback-modal" />,
    Sidebar: ({ routes }: any) => <div data-testid="admin-sidebar">{JSON.stringify(routes)}</div>,
}));
vi.mock('@proton/components/containers/layout/helper', () => ({
    getIsSectionAvailable: vi.fn(),
    getSectionPath: vi.fn(),
}));

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('VPNSidebar', () => {
    const routesMock: Record<string, SectionConfig> = {
        dashboardV2: { id: 'dashboard-v2', icon: 'brand-proton', text: 'text', to: '/to' },
    };

    const organizationRoutesMock: SidebarConfig = {
        header: 'Org header',
        available: true,
        routes: { org: { id: 'org', icon: 'brand-proton', text: 'text', to: '/org' } },
    };

    beforeEach(() => {
        vi.clearAllMocks();

        (hooks.useUser as Mock).mockReturnValue([{ id: '1' }]);
        (orgHooks.useOrganization as Mock).mockReturnValue([{}, false]);

        (helper.getIsSectionAvailable as Mock).mockReturnValue(true);
        (helper.getSectionPath as Mock).mockImplementation((_, section) => section.to);
    });

    it('shows loader when subscription or organization are loading', () => {
        (orgHooks.useOrganization as Mock).mockReturnValue([{}, true]);

        renderWithRouter(
            <VPNSidebar
                navigationRef={createRef()}
                sidebarExpanded={false}
                onSidebarToggle={() => {}}
                routes={routesMock}
                organizationRoutes={organizationRoutesMock}
                adminSidebarFeature={{ loading: true, enabled: false, routes: undefined }}
            />
        );
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders old sidebar when admin feature is disabled', () => {
        renderWithRouter(
            <VPNSidebar
                navigationRef={createRef()}
                sidebarExpanded={false}
                onSidebarToggle={() => {}}
                routes={routesMock}
                organizationRoutes={organizationRoutesMock}
                adminSidebarFeature={{
                    enabled: false as const,
                    loading: false,
                    routes: undefined,
                }}
            />
        );
        expect(screen.getByTestId('sidebar-nav')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-list')).toBeInTheDocument();
        expect(screen.getByTestId('item-/to')).toBeInTheDocument();
        expect(screen.getByTestId('item-/org')).toBeInTheDocument();
        expect(screen.queryByText('New sidebar')).not.toBeInTheDocument();
    });

    it('renders new sidebar when admin feature is enabled', () => {
        const resolved: SidebarTree = {
            items: [
                {
                    id: 'admin',
                    label: 'Admin',
                    to: '/admin',
                    children: undefined,
                    icon: undefined,
                    meta: {},
                },
            ],
        };

        renderWithRouter(
            <VPNSidebar
                navigationRef={createRef()}
                sidebarExpanded={false}
                onSidebarToggle={() => {}}
                routes={routesMock}
                organizationRoutes={organizationRoutesMock}
                adminSidebarFeature={{
                    enabled: true,
                    loading: false,
                    sidebar: { status: true, toggle: vi.fn() },
                    spotlight: { isOn: true, setOff: vi.fn() },
                    routes: resolved,
                    settings: [],
                }}
            />
        );
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByText('New sidebar')).toBeInTheDocument();
        expect(screen.getByText('Share feedback')).toBeInTheDocument();

        const toggle = screen.getByRole('switch');
        expect(toggle).toBeInTheDocument();
    });

    it('toggles new sidebar when toggle is clicked', () => {
        const toggle = vi.fn();

        renderWithRouter(
            <VPNSidebar
                navigationRef={createRef()}
                sidebarExpanded={false}
                onSidebarToggle={() => {}}
                routes={routesMock}
                organizationRoutes={organizationRoutesMock}
                adminSidebarFeature={{
                    enabled: true,
                    loading: false,
                    sidebar: { status: false, toggle },
                    spotlight: { isOn: false, setOff: vi.fn() },
                    routes: {
                        items: [
                            {
                                id: 'admin',
                                label: 'Admin',
                                to: '/admin',
                                children: undefined,
                                icon: undefined,
                                meta: {},
                            },
                        ],
                    },
                    settings: [],
                }}
            />
        );
        const uiToggle = screen.getByRole('switch');
        fireEvent.click(uiToggle);

        expect(toggle).toHaveBeenCalled();
    });
});
