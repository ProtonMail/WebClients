import { renderHook } from '@testing-library/react-hooks';

import { addTokensResponse, apiMock } from '@proton/testing';

import { Autopay, PAYMENT_METHOD_TYPES, SavedPaymentMethod } from '../core';
import { useSavedMethod } from './useSavedMethod';

const onChargeableMock = jest.fn();
const verifyPaymentMock = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

const savedMethod: SavedPaymentMethod = {
    Order: 500,
    ID: '1',
    Type: PAYMENT_METHOD_TYPES.CARD,
    Details: {
        Name: 'John Doe',
        ExpMonth: '12',
        ExpYear: '2032',
        ZIP: '12345',
        Country: 'US',
        Last4: '1234',
        Brand: 'Visa',
    },
    Autopay: Autopay.ENABLE,
};

it('should render', async () => {
    const { result } = renderHook(() =>
        useSavedMethod(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                savedMethod,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    expect(result.current).toBeDefined();
    expect(result.current.meta.type).toBe('saved');
    expect(result.current.fetchingToken).toBe(false);
    expect(result.current.verifyingToken).toBe(false);
    expect(result.current.processingToken).toBe(false);
    expect(result.current.paymentProcessor).toBeDefined();
});

it('should render without savedMethod', async () => {
    const { result } = renderHook(() =>
        useSavedMethod(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    expect(result.current).toBeDefined();
    expect(result.current.meta.type).toBe('saved');
    expect(result.current.fetchingToken).toBe(false);
    expect(result.current.verifyingToken).toBe(false);
    expect(result.current.processingToken).toBe(false);
    expect(result.current.paymentProcessor).toBeUndefined();
});

it('should destroy paymentProcessor', async () => {
    const { result, unmount } = renderHook(() =>
        useSavedMethod(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                savedMethod,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    expect(result.current).toBeDefined();
    expect(result.current.meta.type).toBe('saved');
    expect(result.current.fetchingToken).toBe(false);
    expect(result.current.verifyingToken).toBe(false);
    expect(result.current.processingToken).toBe(false);
    expect(result.current.paymentProcessor).toBeDefined();

    result.current.paymentProcessor!.destroy = jest.fn();

    unmount();

    expect(result.current.paymentProcessor!.destroy).toBeCalled();
});

it('should fetch token', async () => {
    addTokensResponse();

    const { result } = renderHook(() =>
        useSavedMethod(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                savedMethod,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    const tokenPromise = result.current.fetchPaymentToken();
    expect(result.current.fetchingToken).toBe(true);

    const token = await tokenPromise;

    expect(token).toEqual({
        Amount: 1000,
        Currency: 'USD',
        Payment: {
            Type: 'token',
            Details: {
                Token: 'token123',
            },
        },
        chargeable: true,
        type: 'card',
    });
});

it('should process token', async () => {
    addTokensResponse().pending();
    verifyPaymentMock.mockResolvedValue({
        Payment: {
            Type: 'token',
            Details: {
                Token: 'token123',
            },
        },
    });

    const { result } = renderHook(() =>
        useSavedMethod(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                savedMethod,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    await result.current.fetchPaymentToken();
    expect(result.current.fetchingToken).toBe(false);

    const processPromise = result.current.processPaymentToken();
    expect(result.current.processingToken).toBe(true);

    const token = await processPromise;

    expect(result.current.processingToken).toBe(false);
    expect(token).toEqual({
        Amount: 1000,
        Currency: 'USD',
        Payment: {
            Type: 'token',
            Details: {
                Token: 'token123',
            },
        },
        chargeable: true,
        type: 'card',
    });
});

it('should throw during verification if there is no saved method', async () => {
    const { result } = renderHook(() =>
        useSavedMethod(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    await expect(() => result.current.verifyPaymentToken()).rejects.toThrowError('There is no saved method to verify');
});

it('should reset token if verification failed', async () => {
    addTokensResponse().pending();
    verifyPaymentMock.mockRejectedValue(new Error('Verification failed'));

    const { result } = renderHook(() =>
        useSavedMethod(
            {
                amountAndCurrency: {
                    Amount: 1000,
                    Currency: 'USD',
                },
                savedMethod,
                onChargeable: onChargeableMock,
            },
            {
                api: apiMock,
                verifyPayment: verifyPaymentMock,
            }
        )
    );

    await expect(result.current.processPaymentToken()).rejects.toThrowError('Verification failed');
    expect(result.current.verifyingToken).toBe(false);
    expect(result.current.paymentProcessor?.fetchedPaymentToken).toEqual(null);
});
