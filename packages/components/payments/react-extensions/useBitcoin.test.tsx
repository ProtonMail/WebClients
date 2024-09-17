import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import type { AmountAndCurrency } from '@proton/payments';
import { PAYMENT_TOKEN_STATUS } from '@proton/payments';
import type { PaymentsVersion } from '@proton/shared/lib/api/payments';
import { createTokenV4, getTokenStatusV4 } from '@proton/shared/lib/api/payments';
import { MAX_BITCOIN_AMOUNT } from '@proton/shared/lib/constants';
import { addApiMock, addApiResolver, apiMock, flushPromises } from '@proton/testing';

import useBitcoin, { BITCOIN_POLLING_INTERVAL } from './useBitcoin';

const onTokenValidated = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

const paymentsVersion: PaymentsVersion = 'v4';

it('should render', () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 1000,
        Currency: 'EUR',
    };

    const { result } = renderHook(() =>
        useBitcoin({
            api: apiMock,
            onTokenValidated,
            enablePolling: true,
            paymentsVersion,
            ...amountAndCurrency,
        })
    );

    expect(result.current).toBeDefined();
});

it('should request the token', async () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 1000,
        Currency: 'EUR',
    };

    const { result } = renderHook(() =>
        useBitcoin({
            api: apiMock,
            onTokenValidated,
            enablePolling: true,
            paymentsVersion,
            ...amountAndCurrency,
        })
    );

    await result.current.request();
    jest.runAllTicks();

    expect(apiMock).toHaveBeenCalledTimes(1);
});

it('should not request the token automatically', () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 1000,
        Currency: 'EUR',
    };

    const { rerender } = renderHook(
        ({ amountAndCurrency }) =>
            useBitcoin({
                api: apiMock,
                onTokenValidated,
                enablePolling: true,
                paymentsVersion,
                ...amountAndCurrency,
            }),
        {
            initialProps: {
                amountAndCurrency,
            },
        }
    );

    expect(apiMock).toHaveBeenCalledTimes(0);

    rerender({
        amountAndCurrency: {
            Amount: 2000,
            Currency: 'USD',
        },
    });

    expect(apiMock).toHaveBeenCalledTimes(0);
});

it('should not request the token if the amount is too low', async () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 100,
        Currency: 'EUR',
    };

    const { result } = renderHook(() =>
        useBitcoin({
            api: apiMock,
            onTokenValidated,
            enablePolling: true,
            paymentsVersion,
            ...amountAndCurrency,
        })
    );

    await result.current.request();

    expect(apiMock).toHaveBeenCalledTimes(0);
});

it('should not request the token if the amount is too high', async () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: MAX_BITCOIN_AMOUNT + 1000,
        Currency: 'EUR',
    };

    const { result } = renderHook(() =>
        useBitcoin({
            api: apiMock,
            onTokenValidated,
            enablePolling: true,
            paymentsVersion,
            ...amountAndCurrency,
        })
    );

    await result.current.request();

    expect(apiMock).toHaveBeenCalledTimes(0);
});

describe('', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should not request if the token exists and amount and currency are the same', async () => {
        const amountAndCurrency: AmountAndCurrency = {
            Amount: 1000,
            Currency: 'EUR',
        };

        addApiMock(createTokenV4({} as any).url, () => ({
            Code: 1000,
            Token: 'Token-12345',
            Status: 0,
            Data: {
                CoinAddress: 'some-btc-address',
                CoinAmount: 0.000789,
                CoinType: 6,
                CoinAddressReused: false,
            },
        }));

        const { result } = renderHook(() =>
            useBitcoin({
                api: apiMock,
                onTokenValidated,
                enablePolling: true,
                paymentsVersion,
                ...amountAndCurrency,
            })
        );

        await result.current.request();
        jest.runAllTicks();

        expect(apiMock).toHaveBeenCalledTimes(1);

        await result.current.request();
        jest.runAllTicks();
        expect(apiMock).toHaveBeenCalledTimes(1);
    });

    it('should stop polling when enablePolling is set to false', async () => {
        const amountAndCurrency: AmountAndCurrency = {
            Amount: 1000,
            Currency: 'EUR',
        };

        addApiMock(createTokenV4({} as any).url, () => ({
            Code: 1000,
            Token: 'Token-12345',
            Status: 0,
            Data: {
                CoinAddress: 'some-btc-address',
                CoinAmount: 0.000789,
                CoinType: 6,
                CoinAddressReused: false,
            },
        }));

        addApiMock(getTokenStatusV4('Token-12345').url, () => ({
            Code: 1000,
            Status: PAYMENT_TOKEN_STATUS.STATUS_PENDING,
        }));

        const { result, rerender } = renderHook(
            ({ enablePolling }) =>
                useBitcoin({
                    api: apiMock,
                    onTokenValidated,
                    enablePolling,
                    paymentsVersion,
                    ...amountAndCurrency,
                }),
            {
                initialProps: {
                    enablePolling: true,
                },
            }
        );

        await result.current.request();
        expect(apiMock).toHaveBeenCalledTimes(1); // getting the token

        jest.advanceTimersByTime(BITCOIN_POLLING_INTERVAL);
        await flushPromises();
        expect(apiMock).toHaveBeenCalledTimes(2); // checking the token for the first time

        rerender({
            enablePolling: false,
        });

        jest.advanceTimersByTime(BITCOIN_POLLING_INTERVAL);
        await flushPromises();
        expect(apiMock).toHaveBeenCalledTimes(2); // checking the token for the second time must not happen after polling was disabled

        jest.advanceTimersByTime(BITCOIN_POLLING_INTERVAL);
        await flushPromises();
        expect(apiMock).toHaveBeenCalledTimes(2); // checking the token for the second time must not happen after polling was disabled
    });

    it('should stop polling when the token is invalid', async () => {
        const amountAndCurrency: AmountAndCurrency = {
            Amount: 1000,
            Currency: 'EUR',
        };

        addApiMock(createTokenV4({} as any).url, () => ({
            Code: 1000,
            Token: 'Token-12345',
            Status: 0,
            Data: {
                CoinAddress: 'some-btc-address',
                CoinAmount: 0.000789,
                CoinType: 6,
                CoinAddressReused: false,
            },
        }));

        let resolvers: ReturnType<typeof addApiResolver>;
        const updateResolvers = () => {
            resolvers = addApiResolver(getTokenStatusV4('Token-12345').url);
        };
        updateResolvers();

        const resolveToken = () =>
            resolvers.resolve({
                Code: 1000,
                Status: PAYMENT_TOKEN_STATUS.STATUS_PENDING,
            });

        const rejectToken = () =>
            resolvers.reject({
                status: 400,
            });

        const { result } = renderHook(
            ({ enablePolling }) =>
                useBitcoin({
                    api: apiMock,
                    onTokenValidated,
                    enablePolling,
                    paymentsVersion,
                    ...amountAndCurrency,
                }),
            {
                initialProps: {
                    enablePolling: true,
                },
            }
        );

        await result.current.request();
        expect(apiMock).toHaveBeenCalledTimes(1); // getting the token

        updateResolvers();
        await jest.advanceTimersByTimeAsync(BITCOIN_POLLING_INTERVAL);
        resolveToken();
        expect(apiMock).toHaveBeenCalledTimes(2); // checking the token for the first time

        updateResolvers();
        await jest.advanceTimersByTimeAsync(BITCOIN_POLLING_INTERVAL);
        rejectToken();
        expect(apiMock).toHaveBeenCalledTimes(3); // checking the token for the second time

        updateResolvers();
        await jest.advanceTimersByTimeAsync(BITCOIN_POLLING_INTERVAL);
        resolveToken();
        // because of the rejection last time, the next call should never happen, the script must exit from the loop
        expect(apiMock).toHaveBeenCalledTimes(3);
    });

    it('should have awaitingBitcoinPayment === true when the token is created', async () => {
        addApiMock(createTokenV4({} as any).url, () => ({
            Code: 1000,
            Token: 'Token-12345',
            Status: 0,
            Data: {
                CoinAddress: 'some-btc-address',
                CoinAmount: 0.000789,
                CoinType: 6,
                CoinAddressReused: false,
            },
        }));

        const { result } = renderHook(() =>
            useBitcoin({
                api: apiMock,
                onTokenValidated,
                enablePolling: true,
                Amount: 1000,
                Currency: 'USD',
                paymentsVersion,
            })
        );

        expect(result.current.awaitingBitcoinPayment).toBe(false);

        await act(() => result.current.request());
        jest.runAllTicks();

        expect(result.current.awaitingBitcoinPayment).toBe(true);
    });

    it('should set awaitingBitcoinPayment to false when the token is validated', async () => {
        addApiMock(createTokenV4({} as any).url, () => ({
            Code: 1000,
            Token: 'Token-12345',
            Status: 0,
            Data: {
                CoinAddress: 'some-btc-address',
                CoinAmount: 0.000789,
                CoinType: 6,
                CoinAddressReused: false,
            },
        }));

        const { result } = renderHook(() =>
            useBitcoin({
                api: apiMock,
                onTokenValidated,
                enablePolling: true,
                Amount: 1000,
                Currency: 'USD',
                paymentsVersion,
            })
        );

        await act(() => result.current.request());
        expect(result.current.awaitingBitcoinPayment).toBe(true);

        addApiMock(getTokenStatusV4('Token-12345').url, () => ({
            Code: 1000,
            Status: PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE,
        }));

        jest.advanceTimersByTime(BITCOIN_POLLING_INTERVAL);
        await flushPromises();

        expect(result.current.awaitingBitcoinPayment).toBe(false);
    });
});
