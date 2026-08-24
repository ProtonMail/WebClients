import { isDesktop, isSafari } from '@proton/shared/lib/helpers/browser';

/** Mirrors Chargebee's isApplePayQRFlowSupported() for Stripe */
export const isApplePayQRFlowSupported = () => !isSafari() && isDesktop();
