import { isWindows10 } from './isWindows10';

const stubUserAgentData = (platform: string, platformVersion: string) => {
    const getHighEntropyValues = vi.fn().mockResolvedValue({ platformVersion });
    vi.stubGlobal('navigator', { userAgentData: { platform, getHighEntropyValues } });
    return getHighEntropyValues;
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('isWindows10', () => {
    it('returns true for a Windows 10 platform version', async () => {
        stubUserAgentData('Windows', '10.0.0');

        await expect(isWindows10()).resolves.toBe(true);
    });

    it('returns false for a Windows 11 platform version', async () => {
        stubUserAgentData('Windows', '15.0.0');

        await expect(isWindows10()).resolves.toBe(false);
    });

    it('returns false outside Windows without asking for the platform version', async () => {
        const getHighEntropyValues = stubUserAgentData('macOS', '15.0.0');

        await expect(isWindows10()).resolves.toBe(false);
        expect(getHighEntropyValues).not.toHaveBeenCalled();
    });

    it('returns false when the platform version lookup fails', async () => {
        stubUserAgentData('Windows', '10.0.0').mockRejectedValue(new DOMException('', 'NotAllowedError'));

        await expect(isWindows10()).resolves.toBe(false);
    });

    it('returns false when the browser has no user agent client hints', async () => {
        vi.stubGlobal('navigator', {});

        await expect(isWindows10()).resolves.toBe(false);
    });
});
