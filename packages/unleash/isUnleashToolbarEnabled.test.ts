/** @jest-environment jsdom */
import { isDevOrBlackHost } from '@proton/shared/lib/env';

import { ENABLE_UNLEASH_TOOLBAR_KEY, isUnleashToolbarEnabled } from './isUnleashToolbarEnabled';

jest.mock('@proton/shared/lib/env', () => ({
    isDevOrBlackHost: jest.fn(),
}));

const mockIsDevOrBlackHost = jest.mocked(isDevOrBlackHost);

const setWebDriver = (value: boolean) => {
    Object.defineProperty(window.navigator, 'webdriver', { value, configurable: true });
};

const setNodeEnv = (value: string) => {
    process.env.NODE_ENV = value;
};

describe('isUnleashToolbarEnabled', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
        setWebDriver(false);
        setNodeEnv('production');
        mockIsDevOrBlackHost.mockReturnValue(false);
    });

    afterEach(() => {
        setNodeEnv(originalNodeEnv as string);
        window.localStorage.clear();
        jest.clearAllMocks();
    });

    it('returns true in a development build without opting in', () => {
        setNodeEnv('development');

        expect(isUnleashToolbarEnabled()).toBe(true);
    });

    it('returns false on a dev or black host by default', () => {
        mockIsDevOrBlackHost.mockReturnValue(true);

        expect(isUnleashToolbarEnabled()).toBe(false);
    });

    it('returns true on a dev or black host when the opt-in key is set', () => {
        mockIsDevOrBlackHost.mockReturnValue(true);
        window.localStorage.setItem(ENABLE_UNLEASH_TOOLBAR_KEY, 'true');

        expect(isUnleashToolbarEnabled()).toBe(true);
        expect(mockIsDevOrBlackHost).toHaveBeenCalledWith(window.location.host);
    });

    it.each(['false', '1', 'yes', ''])('ignores the opt-in key set to %p', (value) => {
        mockIsDevOrBlackHost.mockReturnValue(true);
        window.localStorage.setItem(ENABLE_UNLEASH_TOOLBAR_KEY, value);

        expect(isUnleashToolbarEnabled()).toBe(false);
    });

    it('stays disabled on any other host even when the opt-in key is set', () => {
        window.localStorage.setItem(ENABLE_UNLEASH_TOOLBAR_KEY, 'true');

        expect(isUnleashToolbarEnabled()).toBe(false);
    });

    it('returns false under WebDriver in a development build', () => {
        setNodeEnv('development');
        setWebDriver(true);

        expect(isUnleashToolbarEnabled()).toBe(false);
    });

    it('returns false under WebDriver on an opted-in dev or black host', () => {
        mockIsDevOrBlackHost.mockReturnValue(true);
        window.localStorage.setItem(ENABLE_UNLEASH_TOOLBAR_KEY, 'true');
        setWebDriver(true);

        expect(isUnleashToolbarEnabled()).toBe(false);
    });
});
