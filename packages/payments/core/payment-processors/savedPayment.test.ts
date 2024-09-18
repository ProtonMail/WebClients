import { apiMock } from '@proton/testing/lib/api';
import { MOCK_TOKEN_RESPONSE, addTokensResponse } from '@proton/testing/lib/payments/api-endpoints';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '../constants';
import { Autopay } from '../constants';
import { type AmountAndCurrency, type SavedPaymentMethodInternal, type V5PaymentToken } from '../interface';
import { SavedPaymentProcessor } from './savedPayment';

describe('SavedPaymentProcessor', () => {
    let savedPaymentProcessor: SavedPaymentProcessor;
    const mockVerifyPayment = jest.fn();
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 1000,
        Currency: 'USD',
    };
    const onTokenIsChargeable = jest.fn().mockResolvedValue(null);
    const savedMethod: SavedPaymentMethodInternal = {
        ID: '123',
        Type: PAYMENT_METHOD_TYPES.CARD,
        Order: 500,
        Autopay: Autopay.ENABLE,
        Details: {
            Name: 'Arthur Morgan',
            ExpMonth: '12',
            ExpYear: '2032',
            ZIP: '12345',
            Country: 'US',
            Last4: '4242',
            Brand: 'Visa',
        },
    };

    beforeEach(() => {
        addTokensResponse();

        savedPaymentProcessor = new SavedPaymentProcessor(
            mockVerifyPayment,
            apiMock,
            amountAndCurrency,
            savedMethod,
            onTokenIsChargeable
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch payment token', async () => {
        const result = await savedPaymentProcessor.fetchPaymentToken();
        expect(result).toEqual({
            Amount: 1000,
            Currency: 'USD',
            PaymentToken: 'token123',
            v: 5,
            chargeable: true,
            type: 'card',
        });
    });

    it('should throw error when verifyPaymentToken is called before fetchPaymentToken', async () => {
        await expect(savedPaymentProcessor.verifyPaymentToken()).rejects.toThrowError(
            'Payment token was not fetched. Please call fetchPaymentToken() first.'
        );
    });

    it('should return ChargeablePaymentToken when amount is 0', async () => {
        savedPaymentProcessor.amountAndCurrency = {
            Amount: 0,
            Currency: 'USD',
        };
        await savedPaymentProcessor.fetchPaymentToken();
        const result = await savedPaymentProcessor.verifyPaymentToken();
        expect(result).toEqual(
            expect.objectContaining({
                type: PAYMENT_METHOD_TYPES.CARD,
                chargeable: true,
                ...savedPaymentProcessor.amountAndCurrency,
            })
        );
        expect(onTokenIsChargeable).toHaveBeenCalledWith(result);
    });

    it('should return ChargeablePaymentToken when fetchedPaymentToken is chargeable', async () => {
        await savedPaymentProcessor.fetchPaymentToken();
        const result = await savedPaymentProcessor.verifyPaymentToken();
        expect(result).toEqual(
            expect.objectContaining({
                type: PAYMENT_METHOD_TYPES.CARD,
                chargeable: true,
                ...savedPaymentProcessor.amountAndCurrency,
                PaymentToken: 'token123',
                v: 5,
            })
        );
        expect(onTokenIsChargeable).toHaveBeenCalledWith(result);
    });

    it('should call verifyPayment when fetchedPaymentToken is not chargeable', async () => {
        addTokensResponse({
            ...MOCK_TOKEN_RESPONSE,
            Status: PAYMENT_TOKEN_STATUS.STATUS_PENDING,
            ApprovalURL: 'https://verify.proton.me',
            ReturnHost: 'https://proton.me',
        } as any);

        const returnToken: V5PaymentToken = {
            PaymentToken: 'token123',
            v: 5,
        };
        mockVerifyPayment.mockResolvedValue(returnToken);

        await savedPaymentProcessor.fetchPaymentToken();
        const result = await savedPaymentProcessor.verifyPaymentToken();

        expect(mockVerifyPayment).toHaveBeenCalledWith({
            ApprovalURL: 'https://verify.proton.me',
            ReturnHost: 'https://proton.me',
            Token: 'token123',
        });

        expect(result).toEqual(
            expect.objectContaining({
                type: PAYMENT_METHOD_TYPES.CARD,
                chargeable: true,
                ...savedPaymentProcessor.amountAndCurrency,
                PaymentToken: 'token123',
                v: 5,
            })
        );
        expect(onTokenIsChargeable).toHaveBeenCalledWith(result);
    });

    it('should throw when verifyPaymentToken throws', async () => {
        addTokensResponse({
            ...MOCK_TOKEN_RESPONSE,
            Status: PAYMENT_TOKEN_STATUS.STATUS_PENDING,
            ApprovalURL: 'https://verify.proton.me',
            ReturnHost: 'https://proton.me',
        } as any);

        mockVerifyPayment.mockRejectedValue(new Error('error'));

        await savedPaymentProcessor.fetchPaymentToken();
        await expect(savedPaymentProcessor.verifyPaymentToken()).rejects.toThrowError('error');
    });

    it('should reset payment token', async () => {
        await savedPaymentProcessor.fetchPaymentToken();
        expect(savedPaymentProcessor.fetchedPaymentToken).toBeTruthy();
        savedPaymentProcessor.reset();
        expect(savedPaymentProcessor.fetchedPaymentToken).toEqual(null);
    });
});
