/** @jest-environment jsdom */
import { isDevOrBlackHost } from '@proton/shared/lib/env';

import { isUnleashToolbarEnabled } from './isUnleashToolbarEnabled';

jest.mock('@proton/shared/lib/env', () => ({
    isDevOrBlackHost: jest.fn(),
}));

const mockIsDevOrBlackHost = isDevOrBlackHost as jest.MockedFunction<typeof isDevOrBlackHost>;

describe('isUnleashToolbarEnabled', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns true on dev and black hosts', () => {
        mockIsDevOrBlackHost.mockReturnValue(true);

        expect(isUnleashToolbarEnabled()).toBe(true);
        expect(mockIsDevOrBlackHost).toHaveBeenCalledWith(window.location.host);
    });

    it('returns false on every other host', () => {
        mockIsDevOrBlackHost.mockReturnValue(false);

        expect(isUnleashToolbarEnabled()).toBe(false);
        expect(mockIsDevOrBlackHost).toHaveBeenCalledWith(window.location.host);
    });
});
