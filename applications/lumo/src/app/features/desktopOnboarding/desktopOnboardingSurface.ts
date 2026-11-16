import { getIsMobileDevice } from '../../util/device';
import type { DesktopOnboardingSurface } from '../../util/telemetry';
import { getNativeAppInfo, isNativeMobileApp } from '../../util/userAgent';
import type { DesktopOnboardingVariant } from './DesktopOnboardingModal';

export const getDesktopOnboardingSurface = (): DesktopOnboardingSurface => {
    if (isNativeMobileApp()) {
        const platform = getNativeAppInfo()?.platform;
        if (platform === 'ios') {
            return 'ios-app';
        }
        if (platform === 'android') {
            return 'android-app';
        }
        return 'mobile-web';
    }
    if (getIsMobileDevice()) {
        return 'mobile-web';
    }
    return 'web';
};

/** Only computers can download the app; phones, tablets and the native apps get "Got it". */
export const getDesktopOnboardingVariant = (surface: DesktopOnboardingSurface): DesktopOnboardingVariant => {
    return surface === 'web' ? 'download' : 'got-it';
};
