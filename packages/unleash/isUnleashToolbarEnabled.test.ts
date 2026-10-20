/** @jest-environment jsdom */
import { isUnleashToolbarEnabled } from './isUnleashToolbarEnabled';

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
        setNodeEnv('development');
    });

    afterEach(() => {
        setNodeEnv(originalNodeEnv as string);
    });

    it('returns true in a development build', () => {
        expect(isUnleashToolbarEnabled()).toBe(true);
    });

    it.each(['production', 'test'])('returns false when NODE_ENV is %p', (nodeEnv) => {
        setNodeEnv(nodeEnv);

        expect(isUnleashToolbarEnabled()).toBe(false);
    });

    it('returns false in a development build driven by WebDriver', () => {
        setWebDriver(true);

        expect(isUnleashToolbarEnabled()).toBe(false);
    });
});
