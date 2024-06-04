import { createSlice } from '@reduxjs/toolkit';

import { ModelState, getInitialModelState } from '@proton/account';
import { WasmApiExchangeRate, WasmFiatCurrencySymbol } from '@proton/andromeda';
import { createAsyncModelThunk, getValidModel, handleAsyncModel } from '@proton/redux-utilities';
import { SECOND } from '@proton/shared/lib/constants';
import { defaultExpiry, isNotStale } from '@proton/shared/lib/helpers/fetchedAt';

import { WalletThunkArguments } from '../thunk';

const name = 'exchange_rate' as const;

type WasmApiExchangeRateByFiat = Partial<Record<string, WasmApiExchangeRate>>;

export interface ExchangeRateState {
    [name]: ModelState<WasmApiExchangeRateByFiat>;
}

type SliceState = ExchangeRateState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectExchangeRate = (state: ExchangeRateState) => {
    return state[name];
};

export const getKeyAndTs = (fiat: WasmFiatCurrencySymbol, date?: Date) => {
    const ts = date && BigInt(Math.floor(date.getTime() / SECOND));
    const key = ts ? `${fiat}-${Number(ts)}` : fiat;

    return [key, ts] as const;
};

const modelThunk = createAsyncModelThunk<
    Model,
    ExchangeRateState,
    WalletThunkArguments,
    [WasmFiatCurrencySymbol, Date?]
>(`${name}/fetch`, {
    miss: async ({ extraArgument, options, getState }) => {
        const stateValue = getState()[name].value;
        if (!options?.thunkArg) {
            return stateValue ?? {};
        }

        const fiat = options?.thunkArg?.[0] ?? 'USD';
        const date = options?.thunkArg?.[1];

        const [key, ts] = getKeyAndTs(fiat, date);

        try {
            const exchangeRate = await extraArgument.walletApi
                .clients()
                .exchange_rate.getExchangeRate(fiat, ts)
                .then((data) => {
                    return data.Data;
                });

            return {
                ...stateValue,
                [key]: exchangeRate,
            };
        } catch {
            return stateValue ?? {};
        }
    },
    previous: ({ getState, options }) => {
        const state = getState()[name];

        if (!options?.thunkArg || !state.value) {
            return undefined;
        }

        const [fiat, date] = options?.thunkArg;
        const [key] = getKeyAndTs(fiat, date);

        if (state.value[key]) {
            return getValidModel({
                value: state.value,
                cache: options?.cache ?? (isNotStale(state.meta?.fetchedAt, defaultExpiry) ? 'stale' : undefined),
            });
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

export const exchangeRateReducer = { [name]: slice.reducer };
export const exchangeRateThunk = modelThunk.thunk;
