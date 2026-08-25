import {
    canShowWebComposer,
    canUseNativeAuth,
    canUseNativeSidebarLayout,
    getNativeAppInfo,
    isNativeAuthFlagEnabled,
} from './userAgent';

const setUserAgent = (userAgent: string) => {
    Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
};

const androidUA = (version: string) =>
    `Mozilla/5.0 (Linux; Android 16; Pixel Tablet) AppleWebKit/537.36 ProtonLumo/${version} (Android 16; Pixel Tablet)`;

const iosUA = (version: string) => `ProtonLumo/${version} (iOS/26.0; iPhone 17)`;

const ipadUA = (version: string) => `ProtonLumo/${version} (iPadOS/26.0; iPad Pro)`;

describe('canShowWebComposer', () => {
    it('is true when the native composer flag is off, even on a recent native app', () => {
        setUserAgent(androidUA('2.1.0'));
        expect(canShowWebComposer(false)).toBe(true);
    });

    // The native composer is not laid out for iPad yet, so the web composer stays on iPadOS.
    it('is true on iPadOS with the flag on, whatever the version', () => {
        setUserAgent(ipadUA('2.1.0'));
        expect(canShowWebComposer(true)).toBe(true);
    });

    it('is false on iPhone at or above the minimum version', () => {
        setUserAgent(iosUA('1.4.0'));
        expect(canShowWebComposer(true)).toBe(false);

        setUserAgent(iosUA('2.1.0'));
        expect(canShowWebComposer(true)).toBe(false);
    });

    it('is true on iPhone below the minimum version', () => {
        setUserAgent(iosUA('1.3.9'));
        expect(canShowWebComposer(true)).toBe(true);
    });

    it('is false on Android at or above the minimum version', () => {
        setUserAgent(androidUA('1.4.0'));
        expect(canShowWebComposer(true)).toBe(false);
    });

    it('is true on Android below the minimum version', () => {
        setUserAgent(androidUA('1.3.9'));
        expect(canShowWebComposer(true)).toBe(true);
    });

    it('is true on an unrecognised native platform', () => {
        setUserAgent('ProtonLumo/2.1.0 (SomethingElse; unknown)');
        expect(canShowWebComposer(true)).toBe(true);
    });

    it('is true outside the native app', () => {
        setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36'
        );
        expect(canShowWebComposer(true)).toBe(true);
    });
});

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

describe('getNativeAppInfo', () => {
    // iPad runs the same binary as iPhone, so it reports as the iOS platform.
    it('reports the ios platform for an iPadOS UA', () => {
        setUserAgent(ipadUA('2.1.0'));
        expect(getNativeAppInfo()).toEqual({ version: '2.1.0', platform: 'ios' });
    });

    it('reports the ios platform for an iPhone UA', () => {
        setUserAgent(iosUA('2.1.0'));
        expect(getNativeAppInfo()).toEqual({ version: '2.1.0', platform: 'ios' });
    });
});

describe('canUseNativeAuth', () => {
    it('is true on iPad at the minimum version, as on iPhone', () => {
        setUserAgent(ipadUA('2.1.0'));
        expect(canUseNativeAuth()).toBe(true);
    });

    it('is true on iPad above the minimum version', () => {
        setUserAgent(ipadUA('2.2.0'));
        expect(canUseNativeAuth()).toBe(true);
    });

    it('is false on iPad below the minimum version', () => {
        setUserAgent(ipadUA('2.0.0'));
        expect(canUseNativeAuth()).toBe(false);
    });

    it('is true on iPhone at the minimum version', () => {
        setUserAgent(iosUA('2.1.0'));
        expect(canUseNativeAuth()).toBe(true);
    });

    it('is false on iPhone below the minimum version', () => {
        setUserAgent(iosUA('2.0.0'));
        expect(canUseNativeAuth()).toBe(false);
    });

    it('is true on Android at the minimum version', () => {
        setUserAgent(androidUA('2.1.0'));
        expect(canUseNativeAuth()).toBe(true);
    });

    it('is false outside the native app', () => {
        setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36'
        );
        expect(canUseNativeAuth()).toBe(false);
    });

    it('is false on an unrecognised native platform', () => {
        setUserAgent('ProtonLumo/2.1.0 (SomethingElse; unknown)');
        expect(canUseNativeAuth()).toBe(false);
    });
});

describe('isNativeAuthFlagEnabled', () => {
    it('reads the Android flag on Android, ignoring the iOS one', () => {
        setUserAgent(androidUA('2.1.0'));

        expect(isNativeAuthFlagEnabled({ android: true, ios: false })).toBe(true);
        expect(isNativeAuthFlagEnabled({ android: false, ios: true })).toBe(false);
    });

    it('reads the iOS flag on iOS, ignoring the Android one', () => {
        setUserAgent(iosUA('2.1.0'));

        expect(isNativeAuthFlagEnabled({ android: false, ios: true })).toBe(true);
        expect(isNativeAuthFlagEnabled({ android: true, ios: false })).toBe(false);
    });

    it('reads the iOS flag on iPadOS too', () => {
        setUserAgent(ipadUA('2.1.0'));

        expect(isNativeAuthFlagEnabled({ android: false, ios: true })).toBe(true);
        expect(isNativeAuthFlagEnabled({ android: true, ios: false })).toBe(false);
    });

    it('is false outside the native app, whatever the flags say', () => {
        setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36'
        );

        expect(isNativeAuthFlagEnabled({ android: true, ios: true })).toBe(false);
    });

    // A UA we cannot place is covered by neither rollout, so it stays on the web auth flow.
    it('is false on an unrecognised native platform', () => {
        setUserAgent('ProtonLumo/2.1.0 (SomethingElse; unknown)');

        expect(isNativeAuthFlagEnabled({ android: true, ios: true })).toBe(false);
    });
});
