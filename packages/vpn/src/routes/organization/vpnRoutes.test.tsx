import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import type { SectionConfig } from '@proton/components/containers/layout/interface';

import * as navigation from '../../contexts/NavigationContext';
import * as routes from '../../definitions/routes';
import { AlwaysOnVpnRoute } from './AlwaysOnVpnRoute';
import { GatewayMonitorRoute } from './GatewayMonitorRoute';
import { GatewaysRoute } from './GatewaysRoute';
import { SharedServersRoute } from './SharedServersRoute';

vi.mock('@proton/components/components/loader/Loader', () => ({
    default: () => <div data-testid="loader" />,
}));

vi.mock('@proton/components/containers/layout/PrivateMainSettingsArea', () => ({
    __esModule: true,
    default: ({ children }: any) => <div data-testid="legacy-area">{children}</div>,
    PrivateMainSettingsAreaBase: ({ title, description, children }: any) => (
        <div data-testid="nav-area" data-title={title}>
            {description}
            {children}
        </div>
    ),
}));

vi.mock('../../components/NavSections', () => ({
    NavSections: ({ content }: any) => <div data-testid="nav-sections">{Object.keys(content).join(',')}</div>,
}));

vi.mock('../../components/Gateways/GatewaysSection', () => ({
    GatewaysSection: () => <div data-testid="content" />,
}));

vi.mock('@proton/components/containers/vpn/sharedServers/SharedServersSection', () => ({
    __esModule: true,
    default: () => <div data-testid="content" />,
}));

vi.mock('@proton/components/containers/b2bDashboard/VPN/VPNEvents', () => ({
    VPNEvents: () => <div data-testid="content" />,
}));

vi.mock('../../components/AlwaysOn/AlwaysOn', () => ({
    AlwaysOn: () => <div data-testid="content" />,
}));

vi.mock('../../contexts/NavigationContext', () => ({
    useB2BAdminNavigation: vi.fn(),
}));

vi.mock('../../definitions/routes', () => ({
    findNavItem: vi.fn(),
}));

const samlSSOMock = vi.fn<() => [{ configs: { Enabled: boolean }[] } | undefined, boolean]>();
vi.mock('@proton/account/samlSSO/hooks', () => ({
    useSamlSSO: () => samlSSOMock(),
}));

const config = { id: 'route', text: 'Route title', to: '/route' } as unknown as SectionConfig;

const navSectionsRoutes = [
    { name: 'GatewaysRoute', Component: GatewaysRoute, navId: 'organization.vpn.gateways' },
    { name: 'SharedServersRoute', Component: SharedServersRoute, navId: 'organization.vpn.shared-servers' },
    { name: 'GatewayMonitorRoute', Component: GatewayMonitorRoute, navId: 'organization.vpn.gateway-monitor' },
];

describe.each(navSectionsRoutes)('$name', ({ Component, navId }) => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders a loader while the navigation feature is loading', () => {
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({ loading: true, enabled: false });

        render(<Component config={config} />);

        expect(screen.getByTestId('loader')).toBeInTheDocument();
        expect(routes.findNavItem).not.toHaveBeenCalled();
    });

    it('renders the nav-driven layout when enabled and the item resolves', () => {
        const nav = { items: [] };
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({ loading: false, enabled: true, nav });
        (routes.findNavItem as Mock).mockReturnValue({ label: 'Nav label', sections: [] });

        render(<Component config={config} />);

        expect(routes.findNavItem).toHaveBeenCalledWith(nav, navId);
        expect(screen.getByTestId('nav-area')).toHaveAttribute('data-title', 'Nav label');
        expect(screen.getByTestId('nav-sections')).toBeInTheDocument();
        expect(screen.queryByTestId('legacy-area')).not.toBeInTheDocument();
    });

    it('falls back to the legacy layout when enabled but the item was pruned (not found)', () => {
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({
            loading: false,
            enabled: true,
            nav: { items: [] },
        });
        (routes.findNavItem as Mock).mockReturnValue(undefined);

        render(<Component config={config} />);

        expect(screen.getByTestId('legacy-area')).toBeInTheDocument();
        expect(screen.getByTestId('content')).toBeInTheDocument();
        expect(screen.queryByTestId('nav-sections')).not.toBeInTheDocument();
    });

    it('falls back to the legacy layout when the admin feature is disabled', () => {
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({ loading: false, enabled: false });

        render(<Component config={config} />);

        expect(screen.getByTestId('legacy-area')).toBeInTheDocument();
        expect(routes.findNavItem).not.toHaveBeenCalled();
    });
});

describe('AlwaysOnVpnRoute', () => {
    const ssoWarning = /SSO users can't sign in on devices with always-on enforced/;

    beforeEach(() => {
        vi.clearAllMocks();
        samlSSOMock.mockReturnValue([{ configs: [{ Enabled: true }] }, false]);
    });

    it('renders a loader while the navigation feature is loading', () => {
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({ loading: true, enabled: false });

        render(<AlwaysOnVpnRoute config={config} />);

        expect(screen.getByTestId('loader')).toBeInTheDocument();
        expect(routes.findNavItem).not.toHaveBeenCalled();
    });

    it('uses the nav item label as title when enabled and the item resolves', () => {
        const nav = { items: [] };
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({ loading: false, enabled: true, nav });
        (routes.findNavItem as Mock).mockReturnValue({ label: 'Always-on VPN' });

        render(<AlwaysOnVpnRoute config={config} />);

        expect(routes.findNavItem).toHaveBeenCalledWith(nav, 'organization.vpn.always-on');
        expect(screen.getByTestId('nav-area')).toHaveAttribute('data-title', 'Always-on VPN');
    });

    it('falls back to the legacy config title when enabled but the item was pruned (not found)', () => {
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({
            loading: false,
            enabled: true,
            nav: { items: [] },
        });
        (routes.findNavItem as Mock).mockReturnValue(undefined);

        render(<AlwaysOnVpnRoute config={config} />);

        expect(screen.getByTestId('nav-area')).toHaveAttribute('data-title', 'Route title');
    });

    it('falls back to the legacy config title when the admin feature is disabled', () => {
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({ loading: false, enabled: false });

        render(<AlwaysOnVpnRoute config={config} />);

        expect(screen.getByTestId('nav-area')).toHaveAttribute('data-title', 'Route title');
        expect(routes.findNavItem).not.toHaveBeenCalled();
    });

    it('warns SSO organizations that their users cannot sign in on devices with always-on enforced', () => {
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({ loading: false, enabled: false });

        render(<AlwaysOnVpnRoute config={config} />);

        expect(screen.getByText(ssoWarning)).toBeInTheDocument();
    });

    it.each([
        { name: 'the organization has no SAML config', samlSSO: { configs: [] } },
        { name: 'every SAML config is disabled', samlSSO: { configs: [{ Enabled: false }] } },
        { name: 'the SAML configs are unavailable', samlSSO: undefined },
    ])('hides the SSO warning when $name', ({ samlSSO }) => {
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({ loading: false, enabled: false });
        samlSSOMock.mockReturnValue([samlSSO, false]);

        render(<AlwaysOnVpnRoute config={config} />);

        expect(screen.queryByText(ssoWarning)).not.toBeInTheDocument();
    });

    it('renders a loader while the SAML configs are loading', () => {
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({ loading: false, enabled: false });
        samlSSOMock.mockReturnValue([undefined, true]);

        render(<AlwaysOnVpnRoute config={config} />);

        expect(screen.getByTestId('loader')).toBeInTheDocument();
        expect(screen.queryByTestId('nav-area')).not.toBeInTheDocument();
    });
});
