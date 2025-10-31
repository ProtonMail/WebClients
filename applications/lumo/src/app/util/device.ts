import { isAndroid, isIpad, isMobile } from '@proton/shared/lib/helpers/browser';

/**
 * Determines if the current device is a mobile device.
 * Includes mobile phones, tablets (iPad), and Android devices.
 *
 * @returns {boolean} True if the device is mobile, tablet, or Android
 */
export const getIsMobileDevice = (): boolean => {
    return isMobile() || isIpad() || isAndroid();
};
