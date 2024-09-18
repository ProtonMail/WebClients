import { apiMock } from '@proton/testing/lib/api';
import { MOCK_TOKEN_RESPONSE, addTokensResolver, addTokensResponse } from '@proton/testing/lib/payments/api-endpoints';

import { type CardModel, getDefaultCard } from '../cardDetails';
import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '../constants';
import type { AmountAndCurrency, ChargeablePaymentToken, TokenPaymentMethod } from '../interface';
import { CardPaymentProcessor } from './cardPayment';

describe('CardPaymentProcessor', () => {
    let paymentProcessor: CardPaymentProcessor;
    const mockVerifyPayment = jest.fn();
    const mockHandler = jest.fn();
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 1000,
        Currency: 'USD',
    };
    const onTokenIsChargeable = jest.fn().mockResolvedValue(null);
    let mockCard: CardModel;

    beforeEach(() => {
        addTokensResponse();

        paymentProcessor = new CardPaymentProcessor(
            mockVerifyPayment,
            apiMock,
            amountAndCurrency,
            false,
            onTokenIsChargeable
        );

        mockCard = {
            number: '4111111111111111',
            month: '01',
            year: '32',
            cvc: '123',
            zip: '12345',
            country: 'US',
        };

        paymentProcessor.updateState({
            card: mockCard,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should update state correctly', () => {
        const newState = { cardSubmitted: true };
        paymentProcessor.updateState(newState);
        expect(paymentProcessor.cardSubmitted).toEqual(true);
    });

    it('should call handler when state is updated', () => {
        paymentProcessor.onStateUpdated(mockHandler);
        const newState = { cardSubmitted: true };
        paymentProcessor.updateState(newState);
        expect(mockHandler).toHaveBeenCalledWith({
            cardSubmitted: true,
        });
    });

    it('should remove handler correctly by id', () => {
        const id = paymentProcessor.onStateUpdated(mockHandler);
        paymentProcessor.removeHandler(id);

        const newState = { cardSubmitted: true };
        paymentProcessor.updateState(newState);
        expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should remove handler correctly by handler', () => {
        paymentProcessor.onStateUpdated(mockHandler);
        paymentProcessor.removeHandler(mockHandler);

        const newState = { cardSubmitted: true };
        paymentProcessor.updateState(newState);
        expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should clear all handlers', () => {
        const otherHandler = jest.fn();
        paymentProcessor.onStateUpdated(mockHandler);
        paymentProcessor.onStateUpdated(otherHandler);
        paymentProcessor.clearHandlers();

        const newState = { cardSubmitted: true };
        paymentProcessor.updateState(newState);
        expect(mockHandler).not.toHaveBeenCalled();
        expect(otherHandler).not.toHaveBeenCalled();
    });

    it('should return ChargeablePaymentToken right away when amount is 0', async () => {
        paymentProcessor.amountAndCurrency = {
            Amount: 0,
            Currency: 'USD',
        };
        await paymentProcessor.fetchPaymentToken();
        const result = await paymentProcessor.verifyPaymentToken();
        expect(result).toEqual({
            type: PAYMENT_METHOD_TYPES.CARD,
            chargeable: true,
            ...paymentProcessor.amountAndCurrency,
        });

        expect(onTokenIsChargeable).toHaveBeenCalledWith(result);
    });

    it('should throw error when method is card but the data is not valid', async () => {
        paymentProcessor.updateState({ card: getDefaultCard() });
        await expect(paymentProcessor.fetchPaymentToken()).rejects.toThrowError();
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
        const expectedResult: ChargeablePaymentToken = {
            type: PAYMENT_METHOD_TYPES.CARD,
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
            ReturnHost: 'https://proton.me',
            Token: 'token123',
            Payment: {
                Details: {
                    CVC: '123',
                    Country: 'US',
                    ExpMonth: '01',
                    ExpYear: '2032',
                    Number: '4111111111111111',
                    ZIP: '12345',
                },
                Type: 'card',
            },
            addCardMode: false,
        });

        expect(result).toEqual(
            expect.objectContaining({
                type: PAYMENT_METHOD_TYPES.CARD,
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

    it('should throw when verifyPaymentToken is called before fetchPaymentToken', async () => {
        await expect(paymentProcessor.verifyPaymentToken()).rejects.toThrowError();
    });

    it('should throw when verification failed', async () => {
        addTokensResponse({
            ...MOCK_TOKEN_RESPONSE,
            Status: PAYMENT_TOKEN_STATUS.STATUS_PENDING,
            ApprovalURL: 'https://verify.proton.me',
            ReturnHost: 'https://proton.me',
        } as any);

        const error = new Error('error');
        mockVerifyPayment.mockRejectedValue(error);

        await paymentProcessor.fetchPaymentToken();
        await expect(paymentProcessor.verifyPaymentToken()).rejects.toThrowError(error);
    });

    it('should remove the payment token', async () => {
        await paymentProcessor.fetchPaymentToken();
        expect(paymentProcessor.fetchedPaymentToken).toBeTruthy();
        paymentProcessor.reset();
        expect(paymentProcessor.fetchedPaymentToken).toEqual(null);
    });
});
