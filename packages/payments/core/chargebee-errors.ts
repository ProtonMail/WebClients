import { c } from 'ttag';

export function getChargebeeErrorCode(error: any): string | undefined {
    return error?.error?.code;
}

/** Chargebee's mountPaymentButton rejects with these when the browser can't run Apple Pay at all - retrying won't help */
const APPLE_PAY_UNSUPPORTED_CODES = ['applePayNotSupported', 'applePayPaymentsNotAvailable'];

export function isApplePayUnsupportedError(error: any): boolean {
    const code = getChargebeeErrorCode(error);
    return !!code && APPLE_PAY_UNSUPPORTED_CODES.includes(code);
}

function getErrorMessageByCode(errorCode: string | undefined): string | undefined {
    switch (errorCode) {
        case 'card_declined':
            return c('Payments.Error')
                .t`Your card was declined. Please try a different card or contact your bank to authorize the charge.`;

        case 'payment_intent_authentication_failure':
        case 'payment_authentication_failed':
            return c('Payments.Error')
                .t`We are unable to authenticate your payment method. Please choose a different payment method or try again.`;

        default:
            return undefined;
    }
}

function getErrorMessage(error: any) {
    return getErrorMessageByCode(getChargebeeErrorCode(error));
}

export function getChargebeeErrorMessage(error: any) {
    const errorMessage = getErrorMessage(error);

    const defaultError = c('Payments.Error').t`Something went wrong. Please try again later.`;

    return (
        [
            errorMessage,
            error?.displayMessage,
            error?.error?.displayMessage,
            error?.message,
            error?.error?.message,
            defaultError,
        ]
            // handling possible Array values
            .map((message) => {
                if (!message || !Array.isArray(message)) {
                    return message;
                }

                return message.join(' ');
            })
            .map((message) => message?.trim?.() ?? message)
            .find((message) => {
                // avoiding empty strings, null, and undefined values
                const isTruthy = !!message;

                // avoiding [object Object] strings
                const isObjectString = message?.toString?.().includes?.({}.toString());

                return isTruthy && !isObjectString;
            })
    );
}
