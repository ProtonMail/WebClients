import { useCallback, useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import { WasmApiExchangeRate, WasmFiatCurrency } from '@proton/andromeda';
import { baseUseSelector } from '@proton/redux-shared-store';
import { createHooks } from '@proton/redux-utilities';

import { exchangeRateThunk, selectExchangeRate } from '../slices';

const hooks = createHooks(exchangeRateThunk, selectExchangeRate);

export const useGetExchangeRate = () => {
    const get = hooks.useGet();
    return useCallback(
        async (fiat: WasmFiatCurrency, date?: Date) => {
            const results = await get({ thunkArg: [fiat, date] });
            return results[fiat];
        },
        [get]
    );
};

export const useExchangeRate = (fiat: WasmFiatCurrency) => {
    const getExchangeRate = useGetExchangeRate();

    const exchangeRateSimpleSelector = createSelector(
        selectExchangeRate,
        (result): [WasmApiExchangeRate | undefined, boolean] => {
            const { error, value } = result;

            const rate = value?.[fiat];
            const loading = rate === undefined && error === undefined;

            return [rate, loading];
        }
    );

    useEffect(() => {
        void getExchangeRate(fiat);
    }, [fiat, getExchangeRate]);

    return baseUseSelector(exchangeRateSimpleSelector);
};
