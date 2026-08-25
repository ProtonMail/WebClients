import { renderHook } from '@testing-library/react';

import { isNativeAuthBridgeAvailable, triggerNativeAccountAction } from '../remote/nativeAuthBridgeHelpers';
import { useLumoAuthAction } from './useLumoAuthAction';
import { useLumoFlags } from './useLumoFlags';

jest.mock('../remote/nativeAuthBridgeHelpers');
jest.mock('./useLumoFlags');

const mockedUseLumoFlags = useLumoFlags as jest.Mock;
const mockedIsBridgeAvailable = isNativeAuthBridgeAvailable as jest.Mock;

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 ProtonLumo/2.1.0 (Android 16; Pixel 9)';
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) ProtonLumo/2.1.0 (iOS/26.0; iPhone 17)';
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36';

const setup = ({
    userAgent,
    android = false,
    ios = false,
    bridgeAvailable = true,
}: {
    userAgent: string;
    android?: boolean;
    ios?: boolean;
    bridgeAvailable?: boolean;
}) => {
    Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
    mockedUseLumoFlags.mockReturnValue({ lumoNativeAuthAndroid: android, lumoNativeAuthIOS: ios });
    mockedIsBridgeAvailable.mockReturnValue(bridgeAvailable);
    return renderHook(() => useLumoAuthAction());
};

describe('useLumoAuthAction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('per-platform flag gating', () => {
        it('is enabled on Android when only the Android flag is on', () => {
            const { result } = setup({ userAgent: ANDROID_UA, android: true, ios: false });

            expect(result.current.isEnabled).toBe(true);
        });

        // The whole point of splitting the flag: an iOS-only rollout must not reach Android.
        it('is disabled on Android when only the iOS flag is on', () => {
            const { result } = setup({ userAgent: ANDROID_UA, android: false, ios: true });

            expect(result.current.isEnabled).toBe(false);
        });

        it('is enabled on iOS when only the iOS flag is on', () => {
            const { result } = setup({ userAgent: IOS_UA, android: false, ios: true });

            expect(result.current.isEnabled).toBe(true);
        });

        it('is disabled on iOS when only the Android flag is on', () => {
            const { result } = setup({ userAgent: IOS_UA, android: true, ios: false });

            expect(result.current.isEnabled).toBe(false);
        });

        it('is disabled on both platforms when both flags are off', () => {
            expect(setup({ userAgent: ANDROID_UA }).result.current.isEnabled).toBe(false);
            expect(setup({ userAgent: IOS_UA }).result.current.isEnabled).toBe(false);
        });
    });

    it('is disabled in a browser even with both flags on', () => {
        const { result } = setup({ userAgent: BROWSER_UA, android: true, ios: true });

        expect(result.current.isEnabled).toBe(false);
    });

    it('is disabled on a native version that predates native auth', () => {
        const { result } = setup({
            userAgent: 'Mozilla/5.0 (Linux; Android 16; Pixel 9) ProtonLumo/2.0.0 (Android 16; Pixel 9)',
            android: true,
        });

        expect(result.current.isEnabled).toBe(false);
    });

    it('is disabled when the native bridge has not been injected', () => {
        const { result } = setup({ userAgent: ANDROID_UA, android: true, bridgeAvailable: false });

        expect(result.current.isEnabled).toBe(false);
    });

    it('maps the action to its native counterpart when enabled', () => {
        const { result } = setup({ userAgent: ANDROID_UA, android: true });

        result.current.trigger('signin');
        result.current.trigger('webaccountsettings');

        expect(triggerNativeAccountAction).toHaveBeenNthCalledWith(1, 'LogIn');
        expect(triggerNativeAccountAction).toHaveBeenNthCalledWith(2, 'WebAccountSettings');
    });

    it('does not reach the bridge when the platform flag is off', () => {
        const { result } = setup({ userAgent: ANDROID_UA, android: false, ios: true });

        result.current.trigger('signin');

        expect(triggerNativeAccountAction).not.toHaveBeenCalled();
    });
});
