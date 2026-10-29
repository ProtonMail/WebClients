import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useFlag } from '@proton/unleash/useFlag';

import { MacSigningMigrationTopBanner } from './MacSigningMigrationTopBanner';

const BANNER_TEXT = /Please update Proton Meet to keep using the app/;

// The app reads the desktop app, its version and the OS from the user agent once, at import, so the
// mocked module reads them from this object instead and each test sets the device it simulates.
const desktop = vi.hoisted(() => ({
    isElectronMeet: false,
    isElectronOnMac: false,
    electronAppVersion: undefined as string | undefined,
}));

vi.mock('@proton/shared/lib/helpers/desktop', () => ({
    get isElectronMeet() {
        return desktop.isElectronMeet;
    },
    get isElectronOnMac() {
        return desktop.isElectronOnMac;
    },
    get electronAppVersion() {
        return desktop.electronAppVersion;
    },
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

const useFlagMock = useFlag as unknown as Mock;

const simulateDevice = (device: { os: 'mac' | 'windows'; version: string } | 'web') => {
    desktop.isElectronMeet = device !== 'web';
    desktop.isElectronOnMac = device !== 'web' && device.os === 'mac';
    desktop.electronAppVersion = device === 'web' ? undefined : device.version;
};

describe('MacSigningMigrationTopBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useFlagMock.mockReturnValue(true);
    });

    it('asks the Mac desktop app below 1.0.14 to update', () => {
        simulateDevice({ os: 'mac', version: '1.0.13' });

        render(<MacSigningMigrationTopBanner />);

        expect(screen.getByText(BANNER_TEXT)).toBeInTheDocument();
        expect(useFlagMock).toHaveBeenCalledWith('MeetDesktopMacSigningMigrationBanner');
    });

    it('links to the download and the support article in a new window', () => {
        simulateDevice({ os: 'mac', version: '1.0.13' });

        render(<MacSigningMigrationTopBanner />);
        const download = screen.getByRole('link', { name: 'Download now' });
        const learnMore = screen.getByRole('link', { name: 'Learn more' });

        expect(download).toHaveAttribute('href', 'https://proton.me/download/meet/macos/ProtonMeet-desktop.dmg');
        expect(download).toHaveAttribute('target', '_blank');
        expect(learnMore).toHaveAttribute('href', 'https://proton.me/support/mail-mac-keychain-password-prompt');
        expect(learnMore).toHaveAttribute('target', '_blank');
    });

    it.each([
        ['the Mac desktop app 1.0.14', { os: 'mac', version: '1.0.14' } as const],
        ['the Windows desktop app below 1.0.14', { os: 'windows', version: '1.0.13' } as const],
        ['the web app', 'web' as const],
    ])('shows nothing in %s', (_, device) => {
        simulateDevice(device);

        render(<MacSigningMigrationTopBanner />);

        expect(screen.queryByText(BANNER_TEXT)).not.toBeInTheDocument();
    });

    it('shows nothing when the flag is off', () => {
        simulateDevice({ os: 'mac', version: '1.0.13' });
        useFlagMock.mockReturnValue(false);

        render(<MacSigningMigrationTopBanner />);

        expect(screen.queryByText(BANNER_TEXT)).not.toBeInTheDocument();
    });
});
