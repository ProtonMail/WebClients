import { isDesktop, isSafari } from '@proton/shared/lib/helpers/browser';

/** Mirrors Chargebee's isApplePayQRFlowSupported() for Stripe */
export const isApplePayQRFlowSupported = () => !isSafari() && isDesktop();

/**
 * - `native` - Safari browsers, uses TouchID/FaceID.
 * - `qr` - should work in all browsers, requires ApplePay JS SDK loaded in the iframe.
 */
export type ApplePayFlow = 'native' | 'qr';

let offeredFlow: ApplePayFlow | null = null;

export const setOfferedApplePayFlow = (flow: ApplePayFlow | null) => {
    offeredFlow = flow;
};

export const getOfferedApplePayFlow = (): ApplePayFlow | null => offeredFlow;
