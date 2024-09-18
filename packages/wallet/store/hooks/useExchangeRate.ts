import { useCallback, useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import type { WasmApiExchangeRate, WasmFiatCurrencySymbol } from '@proton/andromeda';
import { baseUseSelector } from '@proton/react-redux-store';
import { createHooks } from '@proton/redux-utilities';

import { exchangeRateThunk, selectExchangeRate } from '../slices';
import { getKeyAndTs } from '../slices/exchangeRate';

export const exchangeRateHooks = createHooks(exchangeRateThunk, selectExchangeRate);

export const useGetExchangeRate = () => {
    const get = exchangeRateHooks.useGet();
    return useCallback(
        async (fiat: WasmFiatCurrencySymbol, date?: Date) => {
            const results = await get({ thunkArg: [fiat, date] });
            const [key] = getKeyAndTs(fiat, date);

            return results[key];
        },
        [get]
    );
};

export const useExchangeRate = (fiat: WasmFiatCurrencySymbol) => {
    const getExchangeRate = useGetExchangeRate();
    const [, loading] = exchangeRateHooks.useValue();

    const exchangeRateSimpleSelector = createSelector(
        selectExchangeRate,
        (result): [WasmApiExchangeRate | undefined, boolean] => {
            const { value } = result;

            const rate = value?.[fiat];

            return [rate, loading];
        }
    );

    useEffect(() => {
        void getExchangeRate(fiat);
    }, [fiat, getExchangeRate]);

    return baseUseSelector(exchangeRateSimpleSelector);
};
