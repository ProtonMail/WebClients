import { expect, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react-hooks';

import { fetchDesktopVersion } from '@proton/shared/lib/apps/desktopVersions';

import { appPlatforms } from '../../utils/appPlatforms';
import { useDesktopDownloads } from './useDesktopDownloads';

jest.mock('@proton/shared/lib/apps/desktopVersions');
const mockFetchDesktopVersion = jest.mocked(fetchDesktopVersion);

const originalConsoleWarn = console.warn;
const mockConsoleWarn = jest.fn();

describe('useDesktopDownloads', () => {
    let hook: ReturnType<typeof renderHook<{}, ReturnType<typeof useDesktopDownloads>>>;

    const render = async () => {
        hook = renderHook(() => useDesktopDownloads());
        await hook.waitForNextUpdate();
    };

    const assertOK = (
        downloads: ReturnType<typeof useDesktopDownloads>['downloads'],
        expectedUrls?: (string | undefined)[]
    ) => {
        appPlatforms.forEach(({ platform, hideIfUnavailable }) => {
            const index = downloads.findIndex((download) => download.platform === platform);
            const download = downloads[index];

            if (!download) {
                if (hideIfUnavailable) {
                    return;
                }

                throw new Error(`Platform not present: ${platform}`);
            }

            expect(download.url).toBe(expectedUrls ? expectedUrls[index] : 'url');
            expect(download.startDownload).toBeDefined();
        });
    };

    beforeEach(async () => {
        jest.resetAllMocks();

        console.warn = mockConsoleWarn;

        // Some default values for mocks
        mockFetchDesktopVersion.mockResolvedValue({ url: 'url', version: '0.x' });
    });

    afterEach(() => {
        console.warn = originalConsoleWarn;
    });

    it('should return downloads for each platform', async () => {
        await render();

        assertOK(hook.result.current.downloads);
    });

    it('should remove from list ONLY hidden platforms if all fetch calls fail', async () => {
        mockFetchDesktopVersion.mockRejectedValue(new Error('oh no'));

        await render();

        assertOK(hook.result.current.downloads, [undefined, undefined]);
        expect(mockConsoleWarn).toHaveBeenCalledTimes(appPlatforms.length);
    });

    it('should not remove from list platforms not marked for hiding', async () => {
        mockFetchDesktopVersion
            .mockRejectedValueOnce(new Error('oh no'))
            .mockResolvedValueOnce({ url: 'url', version: '0.x' });

        await render();

        assertOK(hook.result.current.downloads, [undefined, 'url', 'url']);
        expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    });
});
