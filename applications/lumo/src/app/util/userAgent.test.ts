import { canUseNativeSidebarLayout } from './userAgent';

const setUserAgent = (userAgent: string) => {
    Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
};

const androidUA = (version: string) =>
    `Mozilla/5.0 (Linux; Android 16; Pixel Tablet) AppleWebKit/537.36 ProtonLumo/${version} (Android 16; Pixel Tablet)`;

describe('canUseNativeSidebarLayout', () => {
    it('is true for Android at the minimum version', () => {
        setUserAgent(androidUA('2.0.4'));
        expect(canUseNativeSidebarLayout()).toBe(true);
    });

    it('is true for Android above the minimum version', () => {
        setUserAgent(androidUA('2.1.0-gms'));
        expect(canUseNativeSidebarLayout()).toBe(true);
    });

    it('is false for Android below the minimum version', () => {
        setUserAgent(androidUA('2.0.3'));
        expect(canUseNativeSidebarLayout()).toBe(false);
    });

    it('is false when the version cannot be parsed', () => {
        setUserAgent(androidUA('2.0'));
        expect(canUseNativeSidebarLayout()).toBe(false);
    });

    it('is false on iOS until native support ships there', () => {
        setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) ProtonLumo/2.0.4 (iOS/26.0; iPhone 17)');
        expect(canUseNativeSidebarLayout()).toBe(false);
    });

    it('is false outside the native app', () => {
        setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36'
        );
        expect(canUseNativeSidebarLayout()).toBe(false);
    });
});
