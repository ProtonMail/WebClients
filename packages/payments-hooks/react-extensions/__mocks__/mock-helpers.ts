import type { BackendPaymentIntent } from '@proton/payments/core/api/api';
import { PAYMENT_TOKEN_STATUS } from '@proton/payments/core/constants';
import type { ChargebeeIframeHandles } from '@proton/payments/core/interface';
import { addApiMock } from '@proton/test-api/vitest/api';

export function mockPostV5Token({
    token = 'token',
    status = PAYMENT_TOKEN_STATUS.CHARGEABLE,
    data = {
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
    },
}: {
    token?: string;
    status?: PAYMENT_TOKEN_STATUS;
    data?: BackendPaymentIntent;
}) {
    addApiMock('payments/v5/tokens', () => {
        return {
            Token: token,
            Status: status,
            Data: data,
        };
    });
}

export function getMockedIframeHandles(): ChargebeeIframeHandles {
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
