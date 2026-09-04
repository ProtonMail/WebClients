/** @jest-environment jsdom */
import { isDevOrBlackHost } from '@proton/shared/lib/env';

import { DISABLE_UNLEASH_TOOLBAR_KEY, isUnleashToolbarEnabled } from './isUnleashToolbarEnabled';

jest.mock('@proton/shared/lib/env', () => ({
    isDevOrBlackHost: jest.fn(),
}));

const mockIsDevOrBlackHost = isDevOrBlackHost as jest.MockedFunction<typeof isDevOrBlackHost>;

const setWebDriver = (value: boolean) => {
    Object.defineProperty(window.navigator, 'webdriver', { value, configurable: true });
};

describe('isUnleashToolbarEnabled', () => {
    beforeEach(() => {
        setWebDriver(false);
    });

    afterEach(() => {
        jest.clearAllMocks();
        window.localStorage.clear();
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

    it('returns false on a dev or black host when the opt-out key is set', () => {
        mockIsDevOrBlackHost.mockReturnValue(true);
        window.localStorage.setItem(DISABLE_UNLEASH_TOOLBAR_KEY, 'true');

        expect(isUnleashToolbarEnabled()).toBe(false);
    });

    it.each(['false', '0', ''])('ignores the opt-out key set to %p', (value) => {
        mockIsDevOrBlackHost.mockReturnValue(true);
        window.localStorage.setItem(DISABLE_UNLEASH_TOOLBAR_KEY, value);

        expect(isUnleashToolbarEnabled()).toBe(true);
    });

    it('stays disabled on a non-dev host regardless of the opt-out key', () => {
        mockIsDevOrBlackHost.mockReturnValue(false);
        window.localStorage.setItem(DISABLE_UNLEASH_TOOLBAR_KEY, 'true');

        expect(isUnleashToolbarEnabled()).toBe(false);
    });

    it('returns false on a dev or black host driven by WebDriver', () => {
        mockIsDevOrBlackHost.mockReturnValue(true);
        setWebDriver(true);

        expect(isUnleashToolbarEnabled()).toBe(false);
    });

    it('stays disabled under WebDriver with no opt-out key present', () => {
        mockIsDevOrBlackHost.mockReturnValue(true);
        setWebDriver(true);

        expect(window.localStorage.getItem(DISABLE_UNLEASH_TOOLBAR_KEY)).toBeNull();
        expect(isUnleashToolbarEnabled()).toBe(false);
    });
});
