import type { Mock } from 'vitest';

import { isAndroid, isIos } from '@proton/shared/lib/helpers/browser';

import { androidMarketplaceUrl, defaultDownloadUrl, iosMarketplaceUrl } from './downloadLinks';
import { getOsDownloadUrl } from './getOsDownloadUrl';

jest.mock('@proton/shared/lib/helpers/browser', () => ({
    isAndroid: jest.fn(),
    isIos: jest.fn(),
}));

describe('getOsDownloadUrl', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the default link when the os is not android nor iOS', () => {
        (isAndroid as Mock).mockReturnValue(false);
        (isIos as Mock).mockReturnValue(false);

        const url = getOsDownloadUrl();

        expect(url).toBe(defaultDownloadUrl);
    });
    it('should return the iOS link when the os is iOS', () => {
        (isAndroid as Mock).mockReturnValue(false);
        (isIos as Mock).mockReturnValue(true);

        const url = getOsDownloadUrl();

        expect(url).toBe(iosMarketplaceUrl);
    });
    it('should return the android link when the os is android', () => {
        (isAndroid as Mock).mockReturnValue(true);
        (isIos as Mock).mockReturnValue(false);

        const url = getOsDownloadUrl();

        expect(url).toBe(androidMarketplaceUrl);
    });
});
