import { useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import { WasmApiExchangeRate, WasmApiWalletAccount } from '@proton/andromeda';
import { baseUseSelector } from '@proton/redux-shared-store';

import { useGetExchangeRate } from '../store/hooks';
import { selectExchangeRate } from '../store/slices';

export const useWalletAccountExchangeRate = (walletAccount?: WasmApiWalletAccount) => {
    const getExchangeRate = useGetExchangeRate();

    const exchangeRateSimpleSelector = createSelector(
        selectExchangeRate,
        (result): [WasmApiExchangeRate | undefined, boolean] => {
            const { error, value } = result;

            const rate = walletAccount?.FiatCurrency && value?.[walletAccount.FiatCurrency];
            const loading = rate === undefined && error === undefined;

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
