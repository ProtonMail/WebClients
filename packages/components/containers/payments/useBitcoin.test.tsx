import { renderHook } from '@testing-library/react-hooks';

import { AmountAndCurrency, PAYMENT_TOKEN_STATUS } from '@proton/components/payments/core';
import { createToken, getTokenStatus } from '@proton/shared/lib/api/payments';
import { MAX_BITCOIN_AMOUNT } from '@proton/shared/lib/constants';
import { addApiMock, addApiResolver, apiMock, flushPromises } from '@proton/testing/index';

import useBitcoin, { BITCOIN_POLLING_INTERVAL } from './useBitcoin';

const onTokenValidated = jest.fn();
const onAwaitingPayment = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

it('should render', () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 1000,
        Currency: 'EUR',
    };

    const { result } = renderHook(() =>
        useBitcoin({
            api: apiMock,
            onTokenValidated,
            onAwaitingPayment,
            enablePolling: true,
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
            onAwaitingPayment,
            enablePolling: true,
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
                onAwaitingPayment,
                enablePolling: true,
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
            onAwaitingPayment,
            enablePolling: true,
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
            onAwaitingPayment,
            enablePolling: true,
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

        addApiMock(createToken({} as any).url, () => ({
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
                onAwaitingPayment,
                enablePolling: true,
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

        addApiMock(createToken({} as any).url, () => ({
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

        addApiMock(getTokenStatus('Token-12345').url, () => ({
            Code: 1000,
            Status: PAYMENT_TOKEN_STATUS.STATUS_PENDING,
        }));

        const { result, rerender } = renderHook(
            ({ enablePolling }) =>
                useBitcoin({
                    api: apiMock,
                    onTokenValidated,
                    onAwaitingPayment,
                    enablePolling,
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

        addApiMock(createToken({} as any).url, () => ({
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
            resolvers = addApiResolver(getTokenStatus('Token-12345').url);
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
                    onAwaitingPayment,
                    enablePolling,
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
});
