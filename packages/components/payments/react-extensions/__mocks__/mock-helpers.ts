import { type BackendPaymentIntent, type ChargebeeIframeHandles, PAYMENT_TOKEN_STATUS } from '@proton/payments';
import { addApiMock } from '@proton/testing/index';

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
        getCanMakePaymentsWithActiveCard: jest.fn(),
    };
}
