import { useCallback, useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import type { WasmFiatCurrencySymbol, WasmPriceGraph, WasmTimeframe } from '@proton/andromeda';
import { baseUseSelector } from '@proton/react-redux-store';
import { createHooks } from '@proton/redux-utilities';

import { getKey, priceGraphDataThunk, selectPriceGraphData } from '../slices/priceGraphData';

export const priceGraphDataHooks = createHooks(priceGraphDataThunk, selectPriceGraphData);

export const useGetPriceGraphData = () => {
    const get = priceGraphDataHooks.useGet();
    return useCallback(
        async (fiat: WasmFiatCurrencySymbol, timeframe: WasmTimeframe) => {
            const results = await get({ thunkArg: [fiat, timeframe] });
            const [key] = getKey(fiat, timeframe);

            return results[key];
        },
        [get]
    );
};

export const usePriceGraphData = (fiat: WasmFiatCurrencySymbol, timeframe: WasmTimeframe) => {
    const getPriceGraphData = useGetPriceGraphData();
    const [, loading] = priceGraphDataHooks.useValue();

    const priceGraphDataSimpleSelector = createSelector(
        selectPriceGraphData,
        (result): [WasmPriceGraph | undefined, boolean] => {
            const key = getKey(fiat, timeframe);

            const { value } = result;
            const rate = value?.[key];

            return [rate, loading];
        }
    );

    useEffect(() => {
        void getPriceGraphData(fiat, timeframe);
    }, [fiat, getPriceGraphData, timeframe]);

    return baseUseSelector(priceGraphDataSimpleSelector);
};
