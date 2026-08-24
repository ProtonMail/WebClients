const APPLE_PAY_SDK_URL = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
const LOAD_TIMEOUT = 10000;

let injection: Promise<void> | undefined;

/**
 * Defines window.ApplePaySession outside Safari, which is what Stripe reads to offer the QR code flow, and what exposes
 * applePayCapabilities(). Chargebee never injects it on the Stripe path, so mountPaymentButton fails with
 * applePayNotSupported without this.
 *
 * A no-op in Safari, where ApplePaySession is native but doesn't carry applePayCapabilities() - so Safari deliberately
 * keeps answering availability through canMakePaymentsWithActiveCard(), which works there.
 */
export function loadApplePaySdk(): Promise<void> {
    if (injection) {
        return injection;
    }

    if ((window as any).ApplePaySession) {
        return Promise.resolve();
    }

    injection = new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, LOAD_TIMEOUT);
        const settle = () => {
            clearTimeout(timeout);
            resolve();
        };

        const script = document.createElement('script');
        script.src = APPLE_PAY_SDK_URL;
        script.crossOrigin = 'anonymous';

        script.addEventListener('load', settle);
        script.addEventListener('error', settle);
        document.head.appendChild(script);
    });

    return injection;
}
