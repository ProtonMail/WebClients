import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import * as orgHooks from '@proton/account/organization/hooks';
import * as subHooks from '@proton/account/subscription/hooks';
import * as hooks from '@proton/account/user/hooks';
import * as helper from '@proton/components/containers/layout/helper';
import type { SectionConfig, SidebarConfig } from '@proton/components/index';
import type { NavResolved } from '@proton/nav/types/nav';
import * as adminHook from '@proton/vpn/hooks/useB2BAdminSidebarFeature';

import { VPNSidebar } from './VPNSidebar';

jest.mock('@proton/components/components/loader/Loader', () => ({
    __esModule: true,
    default: () => <progress data-testid="loader" aria-label="Loading…" />,
}));
jest.mock('@proton/components/components/sidebar/Sidebar', () => ({
    __esModule: true,
    default: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
}));
jest.mock('@proton/components/components/sidebar/SidebarList', () => ({
    __esModule: true,
    default: ({ children }: any) => <ul data-testid="sidebar-list">{children}</ul>,
}));
jest.mock('@proton/components/components/sidebar/SidebarNav', () => ({
    __esModule: true,
    default: ({ children }: any) => <nav data-testid="sidebar-nav">{children}</nav>,
}));

jest.mock('@proton/components/components/sidebar/SettingsListItem', () => ({
    __esModule: true,
    default: ({ children, to }: any) => <li data-testid={`item-${to}`}>{children}</li>,
}));

jest.mock('@proton/account/user/hooks');
jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/account/organization/hooks');
jest.mock('@proton/vpn/hooks/useB2BAdminSidebarFeature');
jest.mock('@proton/vpn/components/Sidebar', () => ({
    FeedbackModal: () => <div data-testid="feedback-modal" />,
    Sidebar: ({ routes }: any) => <div data-testid="admin-sidebar">{JSON.stringify(routes)}</div>,
}));
jest.mock('@proton/components/containers/layout/helper', () => ({
    getIsSectionAvailable: jest.fn(),
    getSectionPath: jest.fn(),
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
        jest.clearAllMocks();

        (hooks.useUser as jest.Mock).mockReturnValue([{ id: '1' }]);
        (subHooks.useSubscription as jest.Mock).mockReturnValue([{}, false]);
        (orgHooks.useOrganization as jest.Mock).mockReturnValue([{}, false]);

        (helper.getIsSectionAvailable as jest.Mock).mockReturnValue(true);
        (helper.getSectionPath as jest.Mock).mockImplementation((_, section) => section.to);
    });

    it('shows loader when subscription or organization are loading', () => {
        (subHooks.useSubscription as jest.Mock).mockReturnValue([{}, true]);

        renderWithRouter(
            <VPNSidebar
                sidebarExpanded={false}
                onSidebarToggle={() => {}}
                routes={routesMock}
                organizationRoutes={organizationRoutesMock}
            />
        );
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders old sidebar when admin feature is disabled', () => {
        (adminHook.useB2BAdminSidebarFeature as jest.Mock).mockReturnValue({
            enabled: false,
            sidebar: { status: false, toggle: jest.fn() },
            feedback: { isOn: false, setOff: jest.fn() },
            spotlight: { isOn: false, setOff: jest.fn() },
            routes: {},
        });

        renderWithRouter(
            <VPNSidebar
                sidebarExpanded={false}
                onSidebarToggle={() => {}}
                routes={routesMock}
                organizationRoutes={organizationRoutesMock}
            />
        );
        expect(screen.getByTestId('sidebar-nav')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-list')).toBeInTheDocument();
        expect(screen.getByTestId('item-/to')).toBeInTheDocument();
        expect(screen.getByTestId('item-/org')).toBeInTheDocument();
        expect(screen.queryByText('New sidebar')).not.toBeInTheDocument();
    });

    it('renders new sidebar when admin feature is enabled', () => {
        const resolved: NavResolved = {
            items: [{ id: 'admin', label: 'Admin', to: '/admin', children: undefined, icon: undefined, meta: {} }],
        };

        (adminHook.useB2BAdminSidebarFeature as jest.Mock).mockReturnValue({
            enabled: true,
            sidebar: { status: true, toggle: jest.fn() },
            feedback: { isOn: true, setOff: jest.fn() },
            spotlight: { isOn: true, setOff: jest.fn() },
            routes: resolved,
        });

        renderWithRouter(
            <VPNSidebar
                sidebarExpanded={false}
                onSidebarToggle={() => {}}
                routes={routesMock}
                organizationRoutes={organizationRoutesMock}
            />
        );
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByText('New sidebar')).toBeInTheDocument();
        expect(screen.getByText('Share feedback')).toBeInTheDocument();

        const toggle = screen.getByRole('switch');
        expect(toggle).toBeInTheDocument();
    });

    it('toggles new sidebar when toggle is clicked', () => {
        const toggle = jest.fn();

        (adminHook.useB2BAdminSidebarFeature as jest.Mock).mockReturnValue({
            enabled: true,
            sidebar: { status: false, toggle },
            feedback: { isOn: false, setOff: jest.fn() },
            spotlight: { isOn: false, setOff: jest.fn() },
            routes: { admin: { to: 'admin', text: 'Admin' } },
        });

        renderWithRouter(
            <VPNSidebar
                sidebarExpanded={false}
                onSidebarToggle={() => {}}
                routes={routesMock}
                organizationRoutes={organizationRoutesMock}
            />
        );
        const uiToggle = screen.getByRole('switch');
        fireEvent.click(uiToggle);

        expect(toggle).toHaveBeenCalled();
    });
});
