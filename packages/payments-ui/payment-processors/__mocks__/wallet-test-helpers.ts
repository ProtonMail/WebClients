import type { BackendPaymentIntent } from '@proton/payments/core/api/api';
import { PAYMENT_TOKEN_STATUS } from '@proton/payments/core/constants';
import type { ChargebeeIframeEvents, ChargebeeIframeHandles } from '@proton/payments/core/interface';
import { addApiMock } from '@proton/test-api/api';

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

export function mockTokenStatus(status: PAYMENT_TOKEN_STATUS, token = 'token') {
    addApiMock(`payments/v5/tokens/${token}`, () => ({ Status: status }));
}

export function getMockedWalletHandles(): ChargebeeIframeHandles {
    return {
        submitCreditCard: jest.fn(),
        initializeCreditCard: jest.fn(),
        initializeSavedCreditCard: jest.fn(),
        validateSavedCreditCard: jest.fn(),
        initializePaypal: jest.fn(),
        setPaypalPaymentIntent: jest.fn(),
        getHeight: jest.fn(),
        getBin: jest.fn(),
        validateCardForm: jest.fn(),
        changeRenderMode: jest.fn(),
        updateFields: jest.fn(),
        initializeDirectDebit: jest.fn(),
        submitDirectDebit: jest.fn(),
        initializeApplePay: jest.fn(),
        setApplePayPaymentIntent: jest.fn(),
        getApplePayCapabilities: jest.fn(),
        initializeGooglePay: jest.fn(),
        setGooglePayPaymentIntent: jest.fn(),
        initializeIdeal: jest.fn(),
        setIdealPaymentIntent: jest.fn(),
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
        jest.fn((callback: (payload?: any) => any) => {
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
