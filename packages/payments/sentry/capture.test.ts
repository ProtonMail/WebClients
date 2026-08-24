import { withScope } from '@sentry/browser';

import { createApiError } from '@proton/shared/lib/fetch/ApiError';
import { captureMessage, getSentryError, traceError } from '@proton/shared/lib/helpers/sentry';

import { CYCLE, FREE_SUBSCRIPTION, PLANS, PLAN_TYPES } from '../core/constants';
import { DisplayablePaymentError } from '../core/errors';
import type { Subscription } from '../core/subscription/interface';
import { capturePaymentMessage, tracePaymentError } from './capture';

jest.mock('@sentry/browser', () => ({ withScope: jest.fn() }));
jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    captureMessage: jest.fn(),
    traceError: jest.fn(),
    getSentryError: jest.fn((error) => error),
}));

const scope = {
    setTag: jest.fn(),
    setTags: jest.fn(),
    setExtra: jest.fn(),
    setExtras: jest.fn(),
    setContext: jest.fn(),
    setLevel: jest.fn(),
    setFingerprint: jest.fn(),
    setTransactionName: jest.fn(),
};

const collectTags = () =>
    Object.assign(
        {},
        Object.fromEntries(scope.setTag.mock.calls as [string, string][]),
        ...scope.setTags.mock.calls.map(([tags]: [any]) => tags)
    );

const chargebeeFailure = {
    correlationId: 'id-9',
    status: 'failure',
    type: 'chargebee-verify-saved-card-response',
    error: {
        code: 'ChargebeeClientError',
        message: 'Allowed values for paymentType: [RECURRING, ONETIME]',
        name: 'invalid_request',
        type: 'ClientError',
    },
};

const subscription = {
    Cycle: CYCLE.MONTHLY,
    Currency: 'EUR',
    CouponCode: null,
    Plans: [{ Name: PLANS.BUNDLE_PRO_2024, Type: PLAN_TYPES.PLAN, Quantity: 1 }],
} as unknown as Subscription;

beforeEach(() => {
    jest.clearAllMocks();
    (getSentryError as jest.Mock).mockImplementation((error) => error);
    (withScope as jest.Mock).mockImplementation((callback) => callback(scope));
});

describe('tracePaymentError', () => {
    it('should capture a non-error payload as an error titled with the underlying reason', () => {
        tracePaymentError(chargebeeFailure, { component: 'subscription-container', subscription });

        const [captured] = (traceError as jest.Mock).mock.calls[0];
        expect(captured).toBeInstanceOf(Error);
        expect(captured.name).toBe('ChargebeeClientError');
        expect(captured.message).toBe('Allowed values for paymentType: [RECURRING, ONETIME]');
    });

    it('should group by component and reason instead of by the capture call stack', () => {
        tracePaymentError(chargebeeFailure, { component: 'subscription-container', subscription });

        expect(scope.setFingerprint).toHaveBeenCalledWith([
            'payments',
            'subscription-container',
            'ChargebeeClientError',
            'Allowed values for paymentType: [RECURRING, ONETIME]',
        ]);
    });

    it('should tag the reporting component and the current subscription', () => {
        tracePaymentError(chargebeeFailure, { component: 'subscription-container', subscription });

        expect(collectTags()).toEqual({
            scope: 'payments',
            component: 'subscription-container',
            subscriptionKey: 'bundlepro2024-EUR-1m',
            upcomingSubscriptionKey: null,
        });
        expect(scope.setTransactionName).toHaveBeenCalledWith('payments/subscription-container');
    });

    it('should report a signup error as having no subscription', () => {
        tracePaymentError(chargebeeFailure, {
            component: 'drive-ctx-payment-step',
            subscription: FREE_SUBSCRIPTION,
        });

        expect(collectTags()).toMatchObject({ subscriptionKey: null, upcomingSubscriptionKey: null });
    });

    it('should preserve tags passed by the caller', () => {
        tracePaymentError(chargebeeFailure, {
            component: 'subscription-container',
            subscription,
            tags: { flow: 'subscription-modal' },
        });

        expect(collectTags()).toMatchObject({ flow: 'subscription-modal', component: 'subscription-container' });
    });

    it('should attach the structured detail of the payload as extras', () => {
        tracePaymentError(chargebeeFailure, { component: 'subscription-container', subscription });

        expect(scope.setExtras).toHaveBeenCalledWith(
            expect.objectContaining({ correlationId: 'id-9', messageType: 'chargebee-verify-saved-card-response' })
        );
    });

    it('should capture a real error as-is so that its stack trace is preserved', () => {
        const error = new DisplayablePaymentError('Card was declined');

        tracePaymentError(error, { component: 'credits-modal', subscription });

        expect(traceError).toHaveBeenCalledWith(error);
        expect(scope.setFingerprint).toHaveBeenCalledWith([
            'payments',
            'credits-modal',
            'DisplayablePaymentError',
            'Card was declined',
        ]);
    });

    it('should synthesise an api error so that beforeSend does not discard the event', () => {
        const apiError = createApiError(
            'StatusCodeError',
            { status: 422, statusText: 'error' } as Response,
            {},
            { Code: 2001, Error: 'Invalid coupon code' }
        );

        tracePaymentError(apiError, { component: 'subscription-container', subscription });

        const [captured] = (traceError as jest.Mock).mock.calls[0];
        expect(captured).not.toBe(apiError);
        expect(captured.name).toBe('PaymentsApiError 2001');
        expect(captured.message).toBe('Invalid coupon code');
    });

    it('should carry the stack of an api error over to the synthetic error', () => {
        const apiError = createApiError(
            'StatusCodeError',
            { status: 422, statusText: 'error' } as Response,
            {},
            { Code: 2001, Error: 'Invalid coupon code' }
        );
        apiError.stack = 'StatusCodeError: Invalid coupon code\n    at createPaymentSubscription (api.ts:1:1)';

        tracePaymentError(apiError, { component: 'subscription-container', subscription });

        const [captured] = (traceError as jest.Mock).mock.calls[0];
        expect(captured.stack).toBe(apiError.stack);
        expect(captured.name).toBe('PaymentsApiError 2001');
        expect(captured.message).toBe('Invalid coupon code');
    });

    it('should still produce a stack when the thrown value has none', () => {
        tracePaymentError(chargebeeFailure, { component: 'subscription-container', subscription });

        const [captured] = (traceError as jest.Mock).mock.calls[0];
        expect(captured.stack).toContain('ChargebeeClientError');
    });

    it('should not capture errors that getSentryError filters out', () => {
        (getSentryError as jest.Mock).mockReturnValue(undefined);

        tracePaymentError(chargebeeFailure, { component: 'subscription-container', subscription });

        expect(traceError).not.toHaveBeenCalled();
    });
});

describe('capturePaymentMessage', () => {
    it('should append the reason of the cause to the message', () => {
        capturePaymentMessage(
            'Payments: Unhandled Chargebee error',
            { component: 'chargebee-iframe' },
            chargebeeFailure
        );

        expect(captureMessage).toHaveBeenCalledWith(
            'Payments: Unhandled Chargebee error – ChargebeeClientError: Allowed values for paymentType: [RECURRING, ONETIME]'
        );
        expect(scope.setFingerprint).toHaveBeenCalledWith([
            'payments',
            'chargebee-iframe',
            'ChargebeeClientError',
            'Payments: Unhandled Chargebee error',
        ]);
    });

    it('should leave a causeless message untouched', () => {
        capturePaymentMessage('Payments: BIN is not found.', { component: 'create-payment-token', level: 'error' });

        expect(captureMessage).toHaveBeenCalledWith('Payments: BIN is not found.');
        expect(scope.setFingerprint).toHaveBeenCalledWith([
            'payments',
            'create-payment-token',
            '',
            'Payments: BIN is not found.',
        ]);
        expect(scope.setLevel).toHaveBeenCalledWith('error');
    });

    it('should not capture a message whose cause getSentryError filters out', () => {
        (getSentryError as jest.Mock).mockReturnValue(undefined);

        capturePaymentMessage('Payments: BIN response failure', { component: 'create-payment-token' }, new Error('x'));

        expect(captureMessage).not.toHaveBeenCalled();
    });
});

/**
 * The payload of a real report (sentry1.json) that used to arrive titled
 * "captureException / Object captured as exception with keys: correlationId, error, status, type".
 */
describe('the saved card verification failure reported from the subscription container', () => {
    const reportedPayload = {
        correlationId: 'id-9',
        error: {
            code: 'ChargebeeClientError',
            detail: [],
            displayMessage: 'An error occurred while processing your request.',
            message: 'Allowed values for paymentType: [RECURRING, ONETIME]',
            name: 'invalid_request',
            type: 'ClientError',
        },
        status: 'failure',
        type: 'chargebee-verify-saved-card-response',
    };

    const capture = () => {
        tracePaymentError(reportedPayload, {
            component: 'subscription-container',
            subscription,
            extra: { app: 'proton-mail', step: 2, processorType: 'saved-chargebee' },
        });

        return (traceError as jest.Mock).mock.calls[0][0] as Error;
    };

    it('should be titled with the reason instead of the shape of the payload', () => {
        expect(`${capture().name}: ${capture().message}`).toBe(
            'ChargebeeClientError: Allowed values for paymentType: [RECURRING, ONETIME]'
        );
    });

    it('should not group with unrelated payment failures reported from the same place', () => {
        capture();

        expect(scope.setFingerprint).toHaveBeenCalledWith([
            'payments',
            'subscription-container',
            'ChargebeeClientError',
            'Allowed values for paymentType: [RECURRING, ONETIME]',
        ]);
    });

    it('should carry the subscription of the user without carrying the user', () => {
        capture();

        expect(collectTags()).toEqual({
            scope: 'payments',
            component: 'subscription-container',
            subscriptionKey: 'bundlepro2024-EUR-1m',
            upcomingSubscriptionKey: null,
        });
        expect(JSON.stringify(scope.setTags.mock.calls)).not.toMatch(/user/i);
    });

    it('should keep the correlation id and the caller context as extras', () => {
        capture();

        const extras = Object.assign({}, ...scope.setExtras.mock.calls.map(([e]: [any]) => e));
        expect(extras).toMatchObject({
            correlationId: 'id-9',
            messageType: 'chargebee-verify-saved-card-response',
            chargebeeErrorName: 'invalid_request',
            app: 'proton-mail',
            step: 2,
        });
    });
});
