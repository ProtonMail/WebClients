import { render, screen } from '@testing-library/react';

import type { UserSettings } from '@proton/shared/lib/interfaces';

import VPNStatusDrawerApp from './VPNStatusDrawerApp';

describe('VPNStatusDrawerApp', () => {
    const mockUserSettings = {
        Locale: 'en_US',
        // ... other user settings can be added as needed
    } as UserSettings;

    const mockConnectedVPN = {
        IsVpnConnection: true,
        Ip: '123.45.67.89',
        CountryCode: 'US',
        IspProvider: 'Proton VPN',
    };

    const mockNotConnectedVPN = {
        IsVpnConnection: false,
        Ip: '98.76.54.32',
        CountryCode: 'FR',
        IspProvider: 'Local ISP',
    };

    it('should display protected status when connected to VPN', () => {
        render(<VPNStatusDrawerApp userSettings={mockUserSettings} connectionInformation={mockConnectedVPN} />);

        expect(screen.getByText('Your online activity is protected')).toBeInTheDocument();
        expect(screen.getByText('VPN IP')).toBeInTheDocument();
        expect(screen.getByText('123.45.67.89')).toBeInTheDocument();
    });

    it('should display unprotected status when not connected to VPN', () => {
        render(<VPNStatusDrawerApp userSettings={mockUserSettings} connectionInformation={mockNotConnectedVPN} />);

        expect(screen.getByText('Not connected')).toBeInTheDocument();
        expect(screen.getByText('Your IP')).toBeInTheDocument();
        expect(screen.getByText('98.76.54.32')).toBeInTheDocument();
        expect(screen.getByText('Local ISP')).toBeInTheDocument();
    });
});
