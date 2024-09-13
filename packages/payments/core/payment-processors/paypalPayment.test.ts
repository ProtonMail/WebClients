import { MAX_CREDIT_AMOUNT, MIN_PAYPAL_AMOUNT_INHOUSE } from '@proton/shared/lib/constants';
import { MOCK_TOKEN_RESPONSE, addTokensResolver, addTokensResponse, apiMock } from '@proton/testing';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '../constants';
import type { AmountAndCurrency, ChargeablePaymentParameters, TokenPaymentMethod } from '../interface';
import { PaypalPaymentProcessor, PaypalWrongAmountError } from './paypalPayment';

describe('PaypalPaymentProcessor', () => {
    let paymentProcessor: PaypalPaymentProcessor;
    const mockVerifyPayment = jest.fn();
    const mockHandler = jest.fn();
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 1000,
        Currency: 'USD',
    };
    const onTokenIsChargeable = jest.fn().mockResolvedValue(null);
    const isCredit = false;

    function resetPaymentProcessor() {
        paymentProcessor = new PaypalPaymentProcessor(
            mockVerifyPayment,
            apiMock,
            amountAndCurrency,
            isCredit,
            onTokenIsChargeable
        );
    }

    beforeEach(() => {
        addTokensResponse();
        resetPaymentProcessor();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call handler when token is fetched', async () => {
        paymentProcessor.onStateUpdated(mockHandler);
        const result = await paymentProcessor.fetchPaymentToken();
        expect(mockHandler).toHaveBeenCalledWith({
            fetchedPaymentToken: expect.objectContaining({
                Amount: 1000,
                Currency: 'USD',
                chargeable: true,
                type: PAYMENT_METHOD_TYPES.PAYPAL,
                PaymentToken: MOCK_TOKEN_RESPONSE.Token,
                v: 5,
            }),
        });

        expect(result).toEqual(
            expect.objectContaining({
                Amount: 1000,
                Currency: 'USD',
                chargeable: true,
                type: PAYMENT_METHOD_TYPES.PAYPAL,
                PaymentToken: MOCK_TOKEN_RESPONSE.Token,
            })
        );
    });

    it('should return ChargeablePaymentToken right away when amount is 0', async () => {
        paymentProcessor.amountAndCurrency = {
            Amount: 0,
            Currency: 'USD',
        };
        await paymentProcessor.fetchPaymentToken();
        const result = await paymentProcessor.verifyPaymentToken();
        expect(result).toEqual(
            expect.objectContaining({
                type: PAYMENT_METHOD_TYPES.PAYPAL,
                chargeable: true,
                ...paymentProcessor.amountAndCurrency,
            })
        );

        expect(onTokenIsChargeable).toHaveBeenCalledWith(result);
    });

    it('should call onTokenIsChargeable when amount is 0 upon returing the token', async () => {
        paymentProcessor.amountAndCurrency = {
            Amount: 0,
            Currency: 'USD',
        };
        await paymentProcessor.fetchPaymentToken();
        await paymentProcessor.verifyPaymentToken();
        expect(onTokenIsChargeable).toHaveBeenCalled();
    });

    it('should call onTokenIsChargeable when amount is not 0 upon returing the token', async () => {
        const expectedResult: ChargeablePaymentParameters = {
            type: PAYMENT_METHOD_TYPES.PAYPAL,
            ...paymentProcessor.amountAndCurrency,
            chargeable: true,
            PaymentToken: MOCK_TOKEN_RESPONSE.Token,
            v: 5,
        };

        await paymentProcessor.fetchPaymentToken();
        const result = await paymentProcessor.verifyPaymentToken();
        expect(result).toEqual(expectedResult);
        expect(onTokenIsChargeable).toHaveBeenCalledWith(result);
    });

    it('should set processingPayment to false when preparePaymentToken throws error', async () => {
        const { reject } = addTokensResolver();

        const promise = paymentProcessor.fetchPaymentToken();

        const error = new Error('error');
        reject(error);
        await expect(promise).rejects.toThrowError(error);
    });

    it('should call mockVerifyPayment', async () => {
        addTokensResponse({
            ...MOCK_TOKEN_RESPONSE,
            Status: PAYMENT_TOKEN_STATUS.STATUS_PENDING,
            ApprovalURL: 'https://verify.proton.me',
            ReturnHost: 'https://proton.me',
        } as any);

        const returnToken: TokenPaymentMethod = {
            Payment: {
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: 'token123',
                },
            },
        };
        mockVerifyPayment.mockResolvedValue(returnToken);

        await paymentProcessor.fetchPaymentToken();
        const result = await paymentProcessor.verifyPaymentToken();
        expect(mockVerifyPayment).toHaveBeenCalledWith({
            ApprovalURL: 'https://verify.proton.me',
            Payment: {
                Type: PAYMENT_METHOD_TYPES.PAYPAL,
            },
            ReturnHost: 'https://proton.me',
            Token: 'token123',
        });

        expect(result).toEqual(
            expect.objectContaining({
                type: PAYMENT_METHOD_TYPES.PAYPAL,
                chargeable: true,
                ...paymentProcessor.amountAndCurrency,
                Payment: {
                    Details: {
                        Token: 'token123',
                    },
                    Type: 'token',
                },
            })
        );
        expect(onTokenIsChargeable).toHaveBeenCalledWith(result);
    });

    it('should throw error when verifyPaymentToken is called without token', async () => {
        await expect(paymentProcessor.verifyPaymentToken()).rejects.toThrowError('Payment token is not fetched');
    });

    it('should save the error and re-trhrow it', async () => {
        addTokensResponse({
            ...MOCK_TOKEN_RESPONSE,
            Status: PAYMENT_TOKEN_STATUS.STATUS_PENDING,
            ApprovalURL: 'https://verify.proton.me',
            ReturnHost: 'https://proton.me',
        } as any);

        mockVerifyPayment.mockRejectedValue(new Error('some error'));

        await paymentProcessor.fetchPaymentToken();
        await expect(paymentProcessor.verifyPaymentToken()).rejects.toThrowError('some error');
        expect(paymentProcessor.verificationError).toEqual(new Error('Paypal payment verification failed'));
    });

    it('should update disabled state depending on the amount', () => {
        paymentProcessor.setAmountAndCurrency({
            Amount: 0,
            Currency: 'USD',
        });
        expect(paymentProcessor.disabled).toBe(false);

        paymentProcessor.setAmountAndCurrency({
            Amount: MIN_PAYPAL_AMOUNT_INHOUSE - 1,
            Currency: 'USD',
        });
        expect(paymentProcessor.disabled).toBe(true);

        paymentProcessor.setAmountAndCurrency({
            Amount: MIN_PAYPAL_AMOUNT_INHOUSE,
            Currency: 'USD',
        });
        expect(paymentProcessor.disabled).toBe(false);

        paymentProcessor.setAmountAndCurrency({
            Amount: (MAX_CREDIT_AMOUNT + MIN_PAYPAL_AMOUNT_INHOUSE) / 2,
            Currency: 'EUR',
        });
        expect(paymentProcessor.disabled).toBe(false);

        paymentProcessor.setAmountAndCurrency({
            Amount: MAX_CREDIT_AMOUNT,
            Currency: 'USD',
        });
        expect(paymentProcessor.disabled).toBe(false);

        paymentProcessor.setAmountAndCurrency({
            Amount: MAX_CREDIT_AMOUNT + 1,
            Currency: 'USD',
        });
        expect(paymentProcessor.disabled).toBe(true);
    });

    it('should throw when amount is not in range', async () => {
        paymentProcessor.setAmountAndCurrency({
            Amount: MIN_PAYPAL_AMOUNT_INHOUSE - 1,
            Currency: 'USD',
        });

        await expect(() => paymentProcessor.fetchPaymentToken()).rejects.toThrowError(PaypalWrongAmountError);

        resetPaymentProcessor();
        paymentProcessor.setAmountAndCurrency({
            Amount: MAX_CREDIT_AMOUNT + 1,
            Currency: 'USD',
        });

        await expect(() => paymentProcessor.fetchPaymentToken()).rejects.toThrowError(PaypalWrongAmountError);

        resetPaymentProcessor();
        paymentProcessor.setAmountAndCurrency({
            Amount: MIN_PAYPAL_AMOUNT_INHOUSE,
            Currency: 'USD',
        });

        const token = await paymentProcessor.fetchPaymentToken();
        expect(token).toBeDefined();
    });

    it('should throw when amount is not in range (no resets)', async () => {
        paymentProcessor.setAmountAndCurrency({
            Amount: MIN_PAYPAL_AMOUNT_INHOUSE - 1,
            Currency: 'USD',
        });

        await expect(() => paymentProcessor.fetchPaymentToken()).rejects.toThrowError(PaypalWrongAmountError);

        paymentProcessor.setAmountAndCurrency({
            Amount: MAX_CREDIT_AMOUNT + 1,
            Currency: 'USD',
        });

        await expect(() => paymentProcessor.fetchPaymentToken()).rejects.toThrowError(PaypalWrongAmountError);

        paymentProcessor.setAmountAndCurrency({
            Amount: MIN_PAYPAL_AMOUNT_INHOUSE,
            Currency: 'USD',
        });

        const token = await paymentProcessor.fetchPaymentToken();
        expect(token).toBeDefined();
    });

    // It's necessary to keep the error to support the retry mechanism properly.
    // Properly means: when there is an error, the user sees Retry button. When the user clicks on it,
    // the error is removed and the token is fetched again. Very important: the token is NOT verified until user
    // clicks on the button the second time. This is because Safari doesn't allow to open a new window without
    // a synchronous user action handling. So, we need to wait for the user to click on the button and then
    // open the window.
    it('should remove token and KEEP error on reset()', () => {
        const error = new Error('error');
        paymentProcessor.updateState({
            fetchedPaymentToken: 'token' as any,
            verificationError: error,
        });

        paymentProcessor.reset();

        expect(paymentProcessor.fetchedPaymentToken).toBeNull();
        expect(paymentProcessor.verificationError).toBe(error);
    });
});
