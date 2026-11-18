import { act } from '@testing-library/react';

import type { BackendPaymentIntent } from '@proton/payments/core/api/api';
import { PAYMENT_TOKEN_STATUS } from '@proton/payments/core/constants';
import type { AmountAndCurrency, ChargebeeIframeEvents, ChargebeeIframeHandles } from '@proton/payments/core/interface';
import { addApiMock, apiMock } from '@proton/test-api/vitest/api';

const paymentIntentData: BackendPaymentIntent = {
    ID: 'id',
    Status: 'inited',
    Amount: 1000,
    GatewayAccountID: 'gatewayAccountID',
    ExpiresAt: 1000,
    PaymentMethodType: 'card',
    CreatedAt: 1000,
    ModifiedAt: 1000,
    UpdatedAt: 1000,
    ResourceVersion: 1,
    Object: 'payment_intent',
    CustomerID: 'customerID',
    CurrencyCode: 'EUR',
    Gateway: 'gateway',
    ReferenceID: 'referenceID',
    Email: 'test@proton.me',
};

export function mockPaymentIntent({
    token = 'token',
    status = PAYMENT_TOKEN_STATUS.CHARGEABLE,
}: { token?: string; status?: PAYMENT_TOKEN_STATUS } = {}) {
    addApiMock('payments/v5/tokens', () => ({ Token: token, Status: status, Data: paymentIntentData }));
}

/**
 * Holds every token request until the test settles it, keyed by the requested amount, so a test can
 * decide in which order overlapping setups get their token.
 */
export function deferTokenRequests() {
    const pending = new Map<number, { resolve: (value: any) => void; reject: (error: any) => void }>();
    addApiMock('payments/v5/tokens', ({ data }) => {
        return new Promise((resolve, reject) => pending.set(data.Amount, { resolve, reject }));
    });
    const tokenResponse = (token: string) => ({
        Token: token,
        Status: PAYMENT_TOKEN_STATUS.CHARGEABLE,
        Data: { ID: token },
    });
    return {
        resolve: async (amount: AmountAndCurrency, token: string) => {
            await act(async () => pending.get(amount.Amount)?.resolve(tokenResponse(token)));
        },
        reject: async (amount: AmountAndCurrency) => {
            await act(async () => pending.get(amount.Amount)?.reject(new Error('Payment processor unavailable')));
        },
    };
}

export function getRequestedTokenAmounts() {
    return apiMock.mock.calls
        .map(([request]) => request)
        .filter((request) => request.url === 'payments/v5/tokens')
        .map((request) => request.data.Amount);
}

export function mockTokenStatus(status: PAYMENT_TOKEN_STATUS, token = 'token') {
    addApiMock(`payments/v5/tokens/${token}`, () => ({ Status: status }));
}

export function getMockedWalletHandles(): ChargebeeIframeHandles {
    return {
        submitCreditCard: vi.fn(),
        initializeCreditCard: vi.fn(),
        initializeSavedCreditCard: vi.fn(),
        validateSavedCreditCard: vi.fn(),
        initializePaypal: vi.fn(),
        setPaypalPaymentIntent: vi.fn(),
        getHeight: vi.fn(),
        getBin: vi.fn(),
        validateCardForm: vi.fn(),
        changeRenderMode: vi.fn(),
        updateFields: vi.fn(),
        initializeDirectDebit: vi.fn(),
        submitDirectDebit: vi.fn(),
        initializeApplePay: vi.fn(),
        setApplePayPaymentIntent: vi.fn(),
        getApplePayCapabilities: vi.fn(),
        initializeGooglePay: vi.fn(),
        setGooglePayPaymentIntent: vi.fn(),
        initializeIdeal: vi.fn(),
        setIdealPaymentIntent: vi.fn(),
    };
}

type EventName = keyof ChargebeeIframeEvents;

/**
 * Records the callbacks the hook subscribes with so a test can fire them, and tracks whether each
 * listener was removed. The real events come from the Chargebee iframe over postMessage.
 */
export function getMockedEvents() {
    const listeners = new Map<EventName, ((payload?: any) => any)[]>();
    const removed: EventName[] = [];

    const subscribe = (name: EventName) =>
        vi.fn((callback: (payload?: any) => any) => {
            listeners.set(name, [...(listeners.get(name) ?? []), callback]);
            return () => {
                removed.push(name);
                listeners.set(
                    name,
                    (listeners.get(name) ?? []).filter((entry) => entry !== callback)
                );
            };
        });

    const names: EventName[] = [
        'onPaypalAuthorized',
        'onPaypalFailure',
        'onPaypalClicked',
        'onPaypalCancelled',
        'onApplePayAuthorized',
        'onApplePayFailure',
        'onApplePayClicked',
        'onApplePayCancelled',
        'onGooglePayAuthorized',
        'onGooglePayFailure',
        'onGooglePayClicked',
        'onGooglePayCancelled',
        'onThreeDsChallenge',
    ];

    const events = Object.fromEntries(names.map((name) => [name, subscribe(name)])) as unknown as ChargebeeIframeEvents;

    return {
        events,
        removed,
        isSubscribed: (name: EventName) => !!listeners.get(name)?.length,
        fire: async (name: EventName, payload?: any) => {
            const callbacks = listeners.get(name);
            if (!callbacks?.length) {
                throw new Error(`Nothing subscribed to ${name}`);
            }
            await Promise.all(callbacks.map((callback) => callback(payload)));
        },
    };
}
