import { createSlice } from '@reduxjs/toolkit';

import { ModelState } from '@proton/account';
import { WasmApiExchangeRate, WasmFiatCurrencySymbol } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel } from '@proton/redux-utilities';
import { SECOND } from '@proton/shared/lib/constants';

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
                .exchange_rate()
                .getExchangeRate(fiat, ts)
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
        const state = getState()[name].value;

        if (!options?.thunkArg || !state) {
            return undefined;
        }

        const [fiat, date] = options?.thunkArg;
        const [key] = getKeyAndTs(fiat, date);

        if (state[key]) {
            return state;
        }

        return undefined;
    },
});

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};

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
