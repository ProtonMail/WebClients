import type { Mock } from 'vitest';

import { isDebianBased, isFedoraOrRedHatBased, isLinux, isMac, isWindows } from '@proton/shared/lib/helpers/browser';

import { getInstallerUrlFromReleases, getLumoDesktopManifestUrl, getLumoDesktopTarget } from './desktopDownloads';

vi.mock('@proton/shared/lib/helpers/browser', () => ({
    isMac: vi.fn(),
    isWindows: vi.fn(),
    isLinux: vi.fn(),
    isDebianBased: vi.fn(),
    isFedoraOrRedHatBased: vi.fn(),
}));

const setOs = ({
    mac = false,
    windows = false,
    linux = false,
    debian = false,
    fedora = false,
}: {
    mac?: boolean;
    windows?: boolean;
    linux?: boolean;
    debian?: boolean;
    fedora?: boolean;
}) => {
    (isMac as Mock).mockReturnValue(mac);
    (isWindows as Mock).mockReturnValue(windows);
    (isLinux as Mock).mockReturnValue(linux);
    (isDebianBased as Mock).mockReturnValue(debian);
    (isFedoraOrRedHatBased as Mock).mockReturnValue(fedora);
};

// Shapes copied from https://proton.me/download/lumo/desktop/<platform>/v1/version.json (2026-11-16).
const macPayload = {
    Releases: [
        {
            CategoryName: 'Stable',
            Version: '0.5.8',
            File: [{ Url: 'https://lumo.protondownload.com/darwin/0.5.8/Lumo-0.5.8.dmg', Identifier: 'dmg' }],
        },
    ],
};

const linuxPayload = {
    Releases: [
        {
            CategoryName: 'Stable',
            Version: '0.5.8',
            File: [
                {
                    Url: 'https://lumo.protondownload.com/linux/0.5.8/Lumo_0.5.8_amd64.deb',
                    Identifier: '.deb (Ubuntu/Debian)',
                },
                {
                    Url: 'https://lumo.protondownload.com/linux/0.5.8/Lumo-0.5.8-1.x86_64.rpm',
                    Identifier: '.rpm (Fedora/RHEL)',
                },
            ],
        },
    ],
};

describe('getLumoDesktopTarget', () => {
    it('picks macOS and Windows', () => {
        setOs({ mac: true });
        expect(getLumoDesktopTarget()).toEqual({ platform: 'macos' });

        setOs({ windows: true });
        expect(getLumoDesktopTarget()).toEqual({ platform: 'windows' });
    });

    it('picks the Linux package format from the distribution', () => {
        setOs({ linux: true, debian: true });
        expect(getLumoDesktopTarget()).toEqual({ platform: 'linux', linuxPackage: 'deb' });

        setOs({ linux: true, fedora: true });
        expect(getLumoDesktopTarget()).toEqual({ platform: 'linux', linuxPackage: 'rpm' });
    });

    it('returns null when no installer fits (unknown Linux, ChromeOS, other)', () => {
        setOs({ linux: true });
        expect(getLumoDesktopTarget()).toBeNull();

        setOs({});
        expect(getLumoDesktopTarget()).toBeNull();
    });
});

describe('getLumoDesktopManifestUrl', () => {
    it('points at the Lumo desktop release files', () => {
        expect(getLumoDesktopManifestUrl('macos')).toBe(
            'https://proton.me/download/lumo/desktop/macos/v1/version.json'
        );
        expect(getLumoDesktopManifestUrl('windows')).toBe(
            'https://proton.me/download/lumo/desktop/windows/v1/version.json'
        );
        expect(getLumoDesktopManifestUrl('linux')).toBe(
            'https://proton.me/download/lumo/desktop/linux/v1/version.json'
        );
    });
});

describe('getInstallerUrlFromReleases', () => {
    it('returns the first file of the stable release', () => {
        expect(getInstallerUrlFromReleases(macPayload)).toBe(
            'https://lumo.protondownload.com/darwin/0.5.8/Lumo-0.5.8.dmg'
        );
    });

    it('returns the matching Linux package', () => {
        expect(getInstallerUrlFromReleases(linuxPayload, 'deb')).toBe(
            'https://lumo.protondownload.com/linux/0.5.8/Lumo_0.5.8_amd64.deb'
        );
        expect(getInstallerUrlFromReleases(linuxPayload, 'rpm')).toBe(
            'https://lumo.protondownload.com/linux/0.5.8/Lumo-0.5.8-1.x86_64.rpm'
        );
    });

    it('accepts a single File object, as in the Drive release files', () => {
        const payload = { Releases: [{ CategoryName: 'Stable', Version: '1', File: { Url: 'https://x/setup.exe' } }] };
        expect(getInstallerUrlFromReleases(payload)).toBe('https://x/setup.exe');
    });

    it('skips non-stable releases and handles malformed payloads', () => {
        const payload = {
            Releases: [
                { CategoryName: 'EarlyAccess', Version: '2', File: [{ Url: 'https://x/beta.dmg' }] },
                { CategoryName: 'Stable', Version: '1', File: [{ Url: 'https://x/stable.dmg' }] },
            ],
        };
        expect(getInstallerUrlFromReleases(payload)).toBe('https://x/stable.dmg');
        expect(getInstallerUrlFromReleases({ Releases: [] })).toBeUndefined();
        expect(getInstallerUrlFromReleases(null)).toBeUndefined();
        expect(getInstallerUrlFromReleases({})).toBeUndefined();
    });
});
