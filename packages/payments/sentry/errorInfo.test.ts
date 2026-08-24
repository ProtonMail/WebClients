import { createApiError } from '@proton/shared/lib/fetch/ApiError';

import { DisplayablePaymentError } from '../core/errors';
import { getPaymentErrorInfo } from './errorInfo';

describe('getPaymentErrorInfo', () => {
    it('should surface the reason of a Chargebee message bus failure', () => {
        const failure = {
            correlationId: 'id-9',
            status: 'failure',
            type: 'chargebee-verify-saved-card-response',
            error: {
                code: 'ChargebeeClientError',
                detail: [],
                displayMessage: 'An error occurred while processing your request.',
                message: 'Allowed values for paymentType: [RECURRING, ONETIME]',
                name: 'invalid_request',
                type: 'ClientError',
            },
        };

        expect(getPaymentErrorInfo(failure)).toEqual({
            name: 'ChargebeeClientError',
            message: 'Allowed values for paymentType: [RECURRING, ONETIME]',
            extra: {
                messageType: 'chargebee-verify-saved-card-response',
                correlationId: 'id-9',
                chargebeeErrorCode: 'ChargebeeClientError',
                chargebeeErrorName: 'invalid_request',
                chargebeeErrorType: 'ClientError',
                chargebeeErrorDetail: [],
            },
        });
    });

    it('should not forward the untyped data payload of a failure', () => {
        const failure = {
            status: 'failure',
            type: 'chargebee-submit-response',
            error: { code: 'ChargebeeClientError', message: 'declined' },
            data: { cardHolder: 'Ada Lovelace', email: 'ada@example.com' },
        };

        const { extra } = getPaymentErrorInfo(failure);

        expect(extra).not.toHaveProperty('data');
        expect(JSON.stringify(extra)).not.toContain('example.com');
    });

    it('should fall back to the display message when the failure has no message', () => {
        const failure = {
            status: 'failure',
            type: 'paypal-failed',
            error: { code: 'PaypalError', displayMessage: 'Payment could not be completed.' },
        };

        expect(getPaymentErrorInfo(failure)).toMatchObject({
            name: 'PaypalError',
            message: 'Payment could not be completed.',
        });
    });

    it('should keep the name and message of a regular error', () => {
        expect(getPaymentErrorInfo(new DisplayablePaymentError('Card was declined'))).toEqual({
            name: 'DisplayablePaymentError',
            message: 'Card was declined',
            extra: {},
        });
    });

    it('should build the name of an api error from its api code', () => {
        const apiError = createApiError(
            'StatusCodeError',
            { status: 422, statusText: 'Unprocessable Entity' } as Response,
            {},
            { Code: 2001, Error: 'Invalid coupon code', Details: { Coupon: 'BLACKFRIDAY' } }
        );

        expect(getPaymentErrorInfo(apiError)).toEqual({
            name: 'PaymentsApiError 2001',
            message: 'Invalid coupon code',
            extra: { apiCode: 2001, httpStatus: 422, apiDetails: { Coupon: 'BLACKFRIDAY' } },
        });
    });

    it('should use a plain object message when there is one', () => {
        expect(getPaymentErrorInfo({ code: 'TokenExpired', message: 'The payment token expired' })).toEqual({
            name: 'TokenExpired',
            message: 'The payment token expired',
            extra: {},
        });
    });

    it('should list the keys of an object that carries no message', () => {
        expect(getPaymentErrorInfo({ status: 418, retry: false })).toEqual({
            name: 'UnknownPaymentError',
            message: 'Non-error thrown with keys: retry, status',
            extra: {},
        });
    });

    it('should truncate long messages', () => {
        const info = getPaymentErrorInfo(new Error('x'.repeat(400)));

        expect(info.message).toHaveLength(251);
        expect(info.message.endsWith('…')).toBe(true);
    });

    it.each([
        ['a string', 'Something went wrong', { name: 'PaymentError', message: 'Something went wrong' }],
        [undefined, undefined, { name: 'UnknownPaymentError', message: 'Non-error thrown: undefined' }],
        [null, null, { name: 'UnknownPaymentError', message: 'Non-error thrown: null' }],
    ])('should handle %s', (_label, exception, expected) => {
        expect(getPaymentErrorInfo(exception)).toMatchObject(expected);
    });
});
