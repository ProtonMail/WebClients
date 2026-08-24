export function getChargebeeErrorCode(error: any): string | undefined {
    return error?.error?.code;
}

/** Chargebee's mountPaymentButton rejects with these when the browser can't run Apple Pay at all - retrying won't help */
const APPLE_PAY_UNSUPPORTED_CODES = ['applePayNotSupported', 'applePayPaymentsNotAvailable'];

export function isApplePayUnsupportedError(error: any): boolean {
    const code = getChargebeeErrorCode(error);
    return !!code && APPLE_PAY_UNSUPPORTED_CODES.includes(code);
}
