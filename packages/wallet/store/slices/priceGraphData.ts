import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import type { WasmFiatCurrencySymbol, WasmPriceGraph, WasmTimeframe } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel } from '@proton/redux-utilities';

import type { WalletThunkArguments } from '../thunk';

const name = 'price_graph' as const;

type WasmPriceGraphByFiatAndTimeframe = Partial<Record<string, WasmPriceGraph>>;

export interface PriceGraphDataState {
    [name]: ModelState<WasmPriceGraphByFiatAndTimeframe>;
}

type SliceState = PriceGraphDataState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPriceGraphData = (state: PriceGraphDataState) => {
    return state[name];
};

export const getKey = (fiat: WasmFiatCurrencySymbol, timeframe: WasmTimeframe) => `${fiat}-${timeframe}`;

const modelThunk = createAsyncModelThunk<
    Model,
    PriceGraphDataState,
    WalletThunkArguments,
    [WasmFiatCurrencySymbol, WasmTimeframe?]
>(`${name}/fetch`, {
    miss: async ({ extraArgument, options, getState }) => {
        const stateValue = getState()[name].value;
        if (!options?.thunkArg) {
            return stateValue ?? {};
        }

        const fiat = options?.thunkArg?.[0] ?? 'USD';
        const timeframe = options?.thunkArg?.[1] ?? 'OneDay';

        const key = getKey(fiat, timeframe);

        try {
            const priceGraph = await extraArgument.walletApi
                .clients()
                .price_graph.getGraphData(fiat, timeframe)
                .then(({ data }) => {
                    return data;
                });

            return {
                [key]: priceGraph,
                ...stateValue,
            };
        } catch (error) {
            return stateValue ?? {};
        }
    },
    previous: ({ getState, options }) => {
        const state = getState()[name];

        if (!state.value) {
            return undefined;
        }

        const fiat = options?.thunkArg?.[0] ?? 'USD';
        const timeframe = options?.thunkArg?.[1] ?? 'OneDay';

        const key = getKey(fiat, timeframe);

        if (state.value[key]) {
            return state;
        }

        return undefined;
    },
});

const initialState = getInitialModelState<Model>();

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const priceGraphDataReducer = { [name]: slice.reducer };
export const priceGraphDataThunk = modelThunk.thunk;
