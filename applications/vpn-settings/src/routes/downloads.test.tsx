import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import type { SectionConfig } from '@proton/components/containers/layout/interface';
import * as navigation from '@proton/vpn/contexts/navigation';
import * as routes from '@proton/vpn/definitions/routes';

import { DownloadsRoute } from './downloads';

vi.mock('@proton/components/components/loader/Loader', () => ({
    __esModule: true,
    default: () => <div data-testid="loader" />,
}));

vi.mock('@proton/components/containers/layout/PrivateMainSettingsArea', () => ({
    __esModule: true,
    default: ({ children }: any) => <div data-testid="legacy-area">{children}</div>,
    PrivateMainSettingsAreaBase: ({ title, children }: any) => (
        <div data-testid="nav-area" data-title={title}>
            {children}
        </div>
    ),
}));

vi.mock('@proton/components/containers/vpn/OpenVPNConfigurationSection/OpenVPNConfigurationSection', () => ({
    __esModule: true,
    default: () => <div data-testid="openvpn-section" />,
}));

vi.mock('@proton/components/containers/vpn/WireGuardConfigurationSection/WireGuardConfigurationSection', () => ({
    __esModule: true,
    default: () => <div data-testid="wireguard-section" />,
}));

vi.mock('@proton/vpn/components/NavSections', () => ({
    NavSections: ({ content }: any) => <div data-testid="nav-sections">{Object.keys(content).join(',')}</div>,
}));

vi.mock('@proton/vpn/components/VPNClientsSection', () => ({
    VPNClientsSection: () => <div data-testid="clients-section" />,
}));

vi.mock('@proton/vpn/contexts/navigation', () => ({
    useB2BAdminNavigation: vi.fn(),
}));

vi.mock('@proton/vpn/definitions/routes', () => ({
    findNavItem: vi.fn(),
}));

const legacyRouteConfig = { id: 'downloads', text: 'Downloads', to: '/downloads' } as unknown as SectionConfig;

describe('DownloadsRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders a loader while the navigation feature is loading', () => {
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({ loading: true, enabled: false });

        render(<DownloadsRoute legacyRouteConfig={legacyRouteConfig} />);

        expect(screen.getByTestId('loader')).toBeInTheDocument();
        expect(routes.findNavItem).not.toHaveBeenCalled();
    });

    it('renders the nav-driven sections when enabled and the item resolves', () => {
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({
            loading: false,
            enabled: true,
            nav: { items: [] },
        });
        (routes.findNavItem as Mock).mockReturnValue({ label: 'Downloads', sections: [] });

        render(<DownloadsRoute legacyRouteConfig={legacyRouteConfig} />);

        expect(screen.getByTestId('nav-area')).toHaveAttribute('data-title', 'Downloads');
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

        render(<DownloadsRoute legacyRouteConfig={legacyRouteConfig} />);

        expect(screen.getByTestId('legacy-area')).toBeInTheDocument();
        expect(screen.queryByTestId('nav-sections')).not.toBeInTheDocument();
        // the legacy layout renders the three download sections directly
        expect(screen.getByTestId('clients-section')).toBeInTheDocument();
        expect(screen.getByTestId('wireguard-section')).toBeInTheDocument();
        expect(screen.getByTestId('openvpn-section')).toBeInTheDocument();
    });

    it('falls back to the legacy layout when the admin feature is disabled', () => {
        (navigation.useB2BAdminNavigation as Mock).mockReturnValue({ loading: false, enabled: false });

        render(<DownloadsRoute legacyRouteConfig={legacyRouteConfig} />);

        expect(screen.getByTestId('legacy-area')).toBeInTheDocument();
        expect(routes.findNavItem).not.toHaveBeenCalled();
    });
});
