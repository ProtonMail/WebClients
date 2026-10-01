import { isDesktop } from '@proton/shared/lib/helpers/browser';

/**
 * The app's CSP forbids Apple's SDK, so an ApplePaySession here is always the browser's own: Safari, but also every
 * other WebKit browser on iOS. Brave iOS is why this isn't isSafari() - ua-parser-js names it Brave despite a Safari UA.
 */
export const hasNativeApplePaySession = () => 'ApplePaySession' in window;

/** Mirrors Chargebee's isApplePayQRFlowSupported() for Stripe */
export const isApplePayQRFlowSupported = () => !hasNativeApplePaySession() && isDesktop();

/**
 * - `native` - browsers with a native ApplePaySession, uses TouchID/FaceID.
 * - `qr` - should work in all browsers, requires ApplePay JS SDK loaded in the iframe.
 */
export type ApplePayFlow = 'native' | 'qr';

let offeredFlow: ApplePayFlow | null = null;

export const setOfferedApplePayFlow = (flow: ApplePayFlow | null) => {
    offeredFlow = flow;
};

export const getOfferedApplePayFlow = (): ApplePayFlow | null => offeredFlow;
