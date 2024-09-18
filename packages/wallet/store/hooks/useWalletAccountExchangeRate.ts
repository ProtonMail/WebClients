import { useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import type { WasmApiExchangeRate, WasmApiWalletAccount } from '@proton/andromeda';
import { baseUseSelector } from '@proton/react-redux-store';

import { exchangeRateHooks, selectExchangeRate, useGetExchangeRate } from '../';

export const useWalletAccountExchangeRate = (walletAccount?: WasmApiWalletAccount) => {
    const getExchangeRate = useGetExchangeRate();
    const [, loading] = exchangeRateHooks.useValue();

    const exchangeRateSimpleSelector = createSelector(
        selectExchangeRate,
        (result): [WasmApiExchangeRate | undefined, boolean] => {
            const { value } = result;

            const rate = walletAccount?.FiatCurrency && value?.[walletAccount.FiatCurrency];

            return [rate, loading];
        }
    );

    useEffect(() => {
        if (walletAccount?.FiatCurrency) {
            void getExchangeRate(walletAccount.FiatCurrency);
        }
    }, [walletAccount?.FiatCurrency, getExchangeRate]);

    return baseUseSelector(exchangeRateSimpleSelector);
};
