import { fetchDesktopVersion } from '@proton/shared/lib/apps/desktopVersions';
import { DESKTOP_PLATFORMS } from '@proton/shared/lib/constants';
import { isMac, isWindows } from '@proton/shared/lib/helpers/browser';

import { appPlatforms, fetchDesktopDownloads } from './appPlatforms';

vi.mock('@proton/shared/lib/apps/desktopVersions');
const mockFetchDesktopVersion = vi.mocked(fetchDesktopVersion);

vi.mock('@proton/shared/lib/helpers/browser');
const mockIsWindows = vi.mocked(isWindows);
const mockIsMac = vi.mocked(isMac);

const originalConsoleWarn = console.warn;
const mockConsoleWarn = vi.fn();

describe('appPlatforms', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Some default values for mocks
        mockIsWindows.mockReturnValue(false);
        mockIsMac.mockReturnValue(false);
    });

    const checkOrder = async (order: DESKTOP_PLATFORMS[]) => {
        vi.resetModules();
        const { appPlatforms } = await import('./appPlatforms');

        expect(appPlatforms.length === order.length);
        appPlatforms.forEach(({ platform }, i) => {
            expect(platform).toBe(order[i]);
        });
    };

    it('should not change order if no platform is preferred', async () => {
        await checkOrder([DESKTOP_PLATFORMS.WINDOWS_X64, DESKTOP_PLATFORMS.WINDOWS_ARM, DESKTOP_PLATFORMS.MACOS]);
    });

    it('should order by preferred platform', async () => {
        mockIsMac.mockReturnValue(true);

        await checkOrder([DESKTOP_PLATFORMS.MACOS, DESKTOP_PLATFORMS.WINDOWS_X64, DESKTOP_PLATFORMS.WINDOWS_ARM]);
    });
});

describe('fetchDesktopDownloads', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        console.warn = mockConsoleWarn;

        // Default values
        mockFetchDesktopVersion.mockResolvedValue({ url: 'url', version: 'version' });
    });

    afterEach(() => {
        console.warn = originalConsoleWarn;
    });

    it('should return a map of platforms to url', async () => {
        const result = await fetchDesktopDownloads();

        appPlatforms.forEach(({ platform }) => {
            expect(result).toHaveProperty(platform);
        });
    });

    it('should return empty object on failure', async () => {
        mockFetchDesktopVersion.mockRejectedValue(new Error('oh no'));

        const result = await fetchDesktopDownloads();

        expect(result).toStrictEqual({});
        expect(mockConsoleWarn).toHaveBeenCalledTimes(appPlatforms.length);
    });

    it('should not include failed calls', async () => {
        mockFetchDesktopVersion.mockRejectedValueOnce(new Error('oh no'));

        const result = await fetchDesktopDownloads();

        appPlatforms.forEach(({ platform }, index) => {
            if (index === 0) {
                expect(result).not.toHaveProperty(platform);
            } else {
                expect(result).toHaveProperty(platform);
            }
        });

        expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    });
});
