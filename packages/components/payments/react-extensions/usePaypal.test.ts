import { renderHook } from '@testing-library/react-hooks';

import { addTokensResponse, apiMock } from '@proton/testing';

import { PAYMENT_METHOD_TYPES } from '../core';
import { usePaypal } from './usePaypal';

const onChargeableMock = jest.fn();
const verifyPaymentMock = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

it('should render', () => {
    const { result } = renderHook(() =>
        usePaypal(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                isCredit: false,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    expect(result.current).toBeDefined();
    expect(result.current.meta.type).toBe('paypal');
    expect(result.current.fetchingToken).toBe(false);
    expect(result.current.verifyingToken).toBe(false);
    expect(result.current.verificationError).toBe(null);
    expect(result.current.tokenFetched).toBe(false);
    expect(result.current.processingToken).toBe(false);
    expect(result.current.paymentProcessor).toBeDefined();
});

it('should render with credit', () => {
    const { result } = renderHook(() =>
        usePaypal(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                isCredit: true,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    expect(result.current).toBeDefined();
    expect(result.current.meta.type).toBe('paypal-credit');
    expect(result.current.fetchingToken).toBe(false);
    expect(result.current.verifyingToken).toBe(false);
    expect(result.current.verificationError).toBe(null);
    expect(result.current.tokenFetched).toBe(false);
    expect(result.current.processingToken).toBe(false);
    expect(result.current.paymentProcessor).toBeDefined();
});

it('should destroy payment processor on unmount', () => {
    const { result, unmount } = renderHook(() =>
        usePaypal(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                isCredit: false,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    result.current.paymentProcessor!.destroy = jest.fn();

    unmount();

    expect(result.current.paymentProcessor!.destroy).toHaveBeenCalledTimes(1);
});

it('should update fetchedPaymentToken', () => {
    const { result } = renderHook(() =>
        usePaypal(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                isCredit: false,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    expect(result.current.tokenFetched).toBe(false);

    result.current.paymentProcessor!.updateState({ fetchedPaymentToken: 'token' });

    expect(result.current.tokenFetched).toBe(true);
});

it('should update verificationError', () => {
    const { result } = renderHook(() =>
        usePaypal(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                isCredit: false,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    expect(result.current.verificationError).toBe(null);

    result.current.paymentProcessor!.updateState({ verificationError: 'error' });

    expect(result.current.verificationError).toBe('error');
});

it('should update verificationError when token fetching fails', async () => {
    addTokensResponse().throw();

    const { result } = renderHook(() =>
        usePaypal(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                isCredit: false,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    expect(result.current.verificationError).toBe(null);

    const tokenPromise = result.current.fetchPaymentToken();
    await expect(tokenPromise).rejects.toThrowError(new Error());
    expect(result.current.verificationError).toEqual(new Error());
});

it('should update verificationError when token verification fails', async () => {
    addTokensResponse().pending();

    verifyPaymentMock.mockRejectedValueOnce(new Error('From the endpoint'));

    const { result } = renderHook(() =>
        usePaypal(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                isCredit: false,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    expect(result.current.verificationError).toBe(null);

    await result.current.fetchPaymentToken();
    const tokenPromise = result.current.verifyPaymentToken();
    await expect(tokenPromise).rejects.toThrowError(new Error('From the endpoint'));
    expect(result.current.verificationError).toEqual(new Error('Paypal payment verification failed'));
});

it('should remove pre-fetched token if verification fails', async () => {
    addTokensResponse().pending();

    verifyPaymentMock.mockRejectedValueOnce(new Error('From the endpoint'));

    const { result } = renderHook(() =>
        usePaypal(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                isCredit: false,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    await result.current.fetchPaymentToken();
    expect(result.current.tokenFetched).toBe(true);

    const tokenPromise = result.current.processPaymentToken();
    await expect(tokenPromise).rejects.toThrowError(new Error('From the endpoint'));
    expect(result.current.tokenFetched).toBe(false);
});

it('should process payment token', async () => {
    addTokensResponse().pending();

    const { result } = renderHook(() =>
        usePaypal(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                isCredit: false,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    const tokenPromise = result.current.processPaymentToken();
    expect(result.current.processingToken).toBe(true);

    const token = await tokenPromise;
    expect(token).toEqual({
        Amount: 1000,
        Currency: 'USD',
        chargeable: true,
        type: PAYMENT_METHOD_TYPES.PAYPAL,
    });
    expect(result.current.tokenFetched).toBe(true);
    expect(result.current.verifyingToken).toBe(false);
    expect(result.current.verificationError).toBe(null);
    expect(result.current.processingToken).toBe(false);
});
