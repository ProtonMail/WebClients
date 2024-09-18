import type { PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react-hooks';
import type { MockedFunction } from 'vitest';

import type { WasmApiExchangeRateData, WasmExchangeRateClient } from '@proton/andromeda';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { SECOND } from '@proton/shared/lib/constants';
import { getMockedApi } from '@proton/wallet/tests';

import { extendStore, setupStore } from '../store';
import { useGetExchangeRate } from './useExchangeRate';

describe('useExchangeRate', () => {
    let mockedGetExchangeRate: MockedFunction<WasmExchangeRateClient['getExchangeRate']>;

    const exchangeRateEur: WasmApiExchangeRateData['Data'] = {
        ID: '00001',
        BitcoinUnit: 'BTC',
        FiatCurrency: 'EUR',
        ExchangeRateTime: '0',
        ExchangeRate: 64110,
        Cents: 100,
    };
    const exchangeRateUsd: WasmApiExchangeRateData['Data'] = {
        ID: '00002',
        BitcoinUnit: 'BTC',
        FiatCurrency: 'USD',
        ExchangeRateTime: '0',
        ExchangeRate: 70110,
        Cents: 100,
    };
    describe('useGetExchangeRate', () => {
        beforeEach(() => {
            vitest.useFakeTimers();
            vitest.setSystemTime(new Date(1713516247000));

            mockedGetExchangeRate = vi
                .fn()
                .mockResolvedValueOnce({ Data: exchangeRateEur })
                .mockResolvedValueOnce({ Data: exchangeRateUsd });

            extendStore({
                walletApi: getMockedApi({
                    exchange_rate: {
                        getExchangeRate: mockedGetExchangeRate,
                    },
                }),
            });
        });

        afterEach(() => {
            vitest.useRealTimers();
        });

        it('should cache result for each fiat', async () => {
            const store = setupStore();

            function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
                return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
            }

            const { result } = renderHook(useGetExchangeRate, {
                wrapper: Wrapper,
            });

            expect(await result.current('EUR')).toStrictEqual(exchangeRateEur);
            expect(mockedGetExchangeRate).toHaveBeenCalledTimes(1);
            expect(mockedGetExchangeRate).toHaveBeenCalledWith('EUR', undefined);

            expect(await result.current('USD')).toStrictEqual(exchangeRateUsd);
            expect(mockedGetExchangeRate).toHaveBeenCalledTimes(2);
            expect(mockedGetExchangeRate).toHaveBeenCalledWith('USD', undefined);

            // getExchangeRate should not be called after that
            mockedGetExchangeRate.mockClear();

            expect(await result.current('EUR')).toStrictEqual(exchangeRateEur);
            expect(mockedGetExchangeRate).toHaveBeenCalledTimes(0);

            expect(await result.current('USD')).toStrictEqual(exchangeRateUsd);
            expect(mockedGetExchangeRate).toHaveBeenCalledTimes(0);
        });

        it('should send request for specific time', async () => {
            const store = setupStore();

            function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
                return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
            }

            const { result } = renderHook(useGetExchangeRate, {
                wrapper: Wrapper,
            });

            expect(await result.current('EUR', new Date(1713516247 * SECOND))).toStrictEqual(exchangeRateEur);
            expect(mockedGetExchangeRate).toHaveBeenCalledTimes(1);
            expect(mockedGetExchangeRate).toHaveBeenCalledWith('EUR', BigInt(1713516247));

            expect(await result.current('USD', new Date(1713516247 * SECOND))).toStrictEqual(exchangeRateUsd);
            expect(mockedGetExchangeRate).toHaveBeenCalledTimes(2);
            expect(mockedGetExchangeRate).toHaveBeenCalledWith('USD', BigInt(1713516247));

            // getExchangeRate should not be called after that
            mockedGetExchangeRate.mockClear();

            expect(await result.current('EUR', new Date(1713516247 * SECOND))).toStrictEqual(exchangeRateEur);
            expect(mockedGetExchangeRate).toHaveBeenCalledTimes(0);

            expect(await result.current('USD', new Date(1713516247 * SECOND))).toStrictEqual(exchangeRateUsd);
            expect(mockedGetExchangeRate).toHaveBeenCalledTimes(0);
        });
    });
});
