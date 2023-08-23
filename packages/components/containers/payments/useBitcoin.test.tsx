import { renderHook } from '@testing-library/react-hooks';

import { AmountAndCurrency } from '@proton/components/payments/core';
import { createToken } from '@proton/shared/lib/api/payments';
import { MAX_BITCOIN_AMOUNT } from '@proton/shared/lib/constants';
import { addApiMock, apiMock } from '@proton/testing/index';

import useBitcoin from './useBitcoin';

beforeEach(() => {
    jest.clearAllMocks();
});

it('should render', () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 1000,
        Currency: 'EUR',
    };

    const { result } = renderHook(() => useBitcoin(apiMock, amountAndCurrency));

    expect(result.current).toBeDefined();
});

it('should request the token', async () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 1000,
        Currency: 'EUR',
    };

    const { result } = renderHook(() => useBitcoin(apiMock, amountAndCurrency));

    await result.current.request();
    jest.runAllTicks();

    expect(apiMock).toHaveBeenCalledTimes(1);
});

it('should not request the token automatically', () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 1000,
        Currency: 'EUR',
    };

    const { rerender } = renderHook(({ amountAndCurrency }) => useBitcoin(apiMock, amountAndCurrency), {
        initialProps: {
            amountAndCurrency,
        },
    });

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

    const { result } = renderHook(() => useBitcoin(apiMock, amountAndCurrency));

    await result.current.request();

    expect(apiMock).toHaveBeenCalledTimes(0);
});

it('should not request the token if the amount is too high', async () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: MAX_BITCOIN_AMOUNT + 1000,
        Currency: 'EUR',
    };

    const { result } = renderHook(() => useBitcoin(apiMock, amountAndCurrency));

    await result.current.request();

    expect(apiMock).toHaveBeenCalledTimes(0);
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

    const { result } = renderHook(() => useBitcoin(apiMock, amountAndCurrency));

    await result.current.request();
    jest.runAllTicks();

    expect(apiMock).toHaveBeenCalledTimes(1);

    await result.current.request();
    jest.runAllTicks();
    expect(apiMock).toHaveBeenCalledTimes(1);
});
