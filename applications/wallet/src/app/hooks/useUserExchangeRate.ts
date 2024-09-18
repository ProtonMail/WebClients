import { useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import type { WasmApiExchangeRate } from '@proton/andromeda';
import { baseUseSelector } from '@proton/react-redux-store';
import { selectExchangeRate, useGetExchangeRate, useWalletSettings } from '@proton/wallet/store';

export const useUserExchangeRate = () => {
    const [walletSettings] = useWalletSettings();
    const getExchangeRate = useGetExchangeRate();

    const exchangeRateSimpleSelector = createSelector(
        selectExchangeRate,
        (result): [WasmApiExchangeRate | undefined, boolean] => {
            const { error, value } = result;

            const rate = walletSettings?.FiatCurrency && value?.[walletSettings.FiatCurrency];
            const loading = rate === undefined && error === undefined;

            return [rate, loading];
        }
    );

    useEffect(() => {
        if (walletSettings?.FiatCurrency) {
            void getExchangeRate(walletSettings.FiatCurrency);
        }
    }, [walletSettings?.FiatCurrency, getExchangeRate]);

    return baseUseSelector(exchangeRateSimpleSelector);
};
