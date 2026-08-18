import type { Mock } from 'vitest';

import { isAndroid, isArm, isIos, isMac, isWindows } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { androidMarketplaceUrl, defaultDownloadUrl, iosMarketplaceUrl } from '../../constants/downloadLinks';
import { useFetchDownloadLinks } from '../hooks/useFetchDownloadLinks';
import { useOsDownloadUrl } from './useOsDownloadUrl';

vi.mock('@proton/shared/lib/helpers/browser', () => ({
    isAndroid: vi.fn(),
    isArm: vi.fn(),
    isIos: vi.fn(),
    isMac: vi.fn(),
    isWindows: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

vi.mock('../hooks/useFetchDownloadLinks', () => ({
    useFetchDownloadLinks: vi.fn(),
}));

describe('useOsDownloadUrl', () => {
    const mockWindowsX64Link = 'https://protonvpn.com/download/ProtonVPN_v4.3.11_x64.exe';
    const mockWindowsArm64Link = 'https://protonvpn.com/download/ProtonVPN_v4.3.11_arm64.exe';
    const mockMacLink = 'https://protonvpn.com/download/ProtonVPN_mac_v6.3.0.dmg';

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock values - all false
        (isAndroid as Mock).mockReturnValue(false);
        (isIos as Mock).mockReturnValue(false);
        (isMac as Mock).mockReturnValue(false);
        (isWindows as Mock).mockReturnValue(false);
        (isArm as Mock).mockReturnValue(false);
        (useFlag as Mock).mockReturnValue(true);
        (useFetchDownloadLinks as Mock).mockReturnValue({
            windows: undefined,
            mac: undefined,
        });
    });

    it('should return the iOS link when the os is iOS', () => {
        (isIos as Mock).mockReturnValue(true);

        const url = useOsDownloadUrl();

        expect(url).toBe(iosMarketplaceUrl);
    });

    it('should return the android link when the os is android', () => {
        (isAndroid as Mock).mockReturnValue(true);

        const url = useOsDownloadUrl();

        expect(url).toBe(androidMarketplaceUrl);
    });

    it('should return the macOS link when the os is macOS', () => {
        (isMac as Mock).mockReturnValue(true);
        (useFetchDownloadLinks as Mock).mockReturnValue({
            windows: undefined,
            mac: [{ title: () => 'macOS 14 (Sonoma) or newer', link: mockMacLink }],
        });

        const url = useOsDownloadUrl();

        expect(url).toBe(mockMacLink);
    });

    it('should return the Windows x64 link when the os is Windows and not ARM', () => {
        (isWindows as Mock).mockReturnValue(true);
        (isArm as Mock).mockReturnValue(false);
        (useFetchDownloadLinks as Mock).mockReturnValue({
            windows: [
                { title: () => 'Windows 10/11 (x64)', link: mockWindowsX64Link },
                { title: () => 'Windows 10/11 (ARM64)', link: mockWindowsArm64Link },
            ],
            mac: undefined,
        });

        const url = useOsDownloadUrl();

        expect(url).toBe(mockWindowsX64Link);
    });

    it('should return the Windows ARM64 link when the os is Windows and ARM', () => {
        (isWindows as Mock).mockReturnValue(true);
        (isArm as Mock).mockReturnValue(true);
        (useFetchDownloadLinks as Mock).mockReturnValue({
            windows: [
                { title: () => 'Windows 10/11 (x64)', link: mockWindowsX64Link },
                { title: () => 'Windows 10/11 (ARM64)', link: mockWindowsArm64Link },
            ],
            mac: undefined,
        });

        const url = useOsDownloadUrl();

        expect(url).toBe(mockWindowsArm64Link);
    });

    it('should return fallback x64 link when Windows download links exist but ARM64 title not found', () => {
        (isWindows as Mock).mockReturnValue(true);
        (isArm as Mock).mockReturnValue(false);
        (useFetchDownloadLinks as Mock).mockReturnValue({
            windows: [{ title: () => 'Windows 10/11 (x64)', link: mockWindowsX64Link }],
            mac: undefined,
        });

        const url = useOsDownloadUrl();

        expect(url).toBe(mockWindowsX64Link);
    });

    it('should return fallback link when Windows ARM architecture but only x64 available', () => {
        (isWindows as Mock).mockReturnValue(true);
        (isArm as Mock).mockReturnValue(true);
        (useFetchDownloadLinks as Mock).mockReturnValue({
            windows: [{ title: () => 'Windows 10/11 (x64)', link: mockWindowsX64Link }],
            mac: undefined,
        });

        const url = useOsDownloadUrl();

        expect(url).toBe(defaultDownloadUrl);
    });

    it('should return the default link when the os is not recognized or has no downloads', () => {
        (isAndroid as Mock).mockReturnValue(false);
        (isIos as Mock).mockReturnValue(false);
        (isMac as Mock).mockReturnValue(false);
        (isWindows as Mock).mockReturnValue(false);

        const url = useOsDownloadUrl();

        expect(url).toBe(defaultDownloadUrl);
    });

    it('should return the default link when Windows has no download links available', () => {
        (isWindows as Mock).mockReturnValue(true);
        (useFetchDownloadLinks as Mock).mockReturnValue({
            windows: undefined,
            mac: undefined,
        });

        const url = useOsDownloadUrl();

        expect(url).toBe(defaultDownloadUrl);
    });
});
