import { useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import { WasmApiExchangeRate, WasmApiWalletAccount } from '@proton/andromeda';
import { baseUseSelector } from '@proton/redux-shared-store';

import { useGetExchangeRate } from '../store/hooks';
import { exchangeRateHooks } from '../store/hooks/useExchangeRate';
import { selectExchangeRate } from '../store/slices';

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
