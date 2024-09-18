import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import type { WasmApiExchangeRate, WasmFiatCurrencySymbol } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel } from '@proton/redux-utilities';
import { SECOND } from '@proton/shared/lib/constants';

import type { WalletThunkArguments } from '../thunk';

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

const SEPARATOR = '-';

export const serialiseKey = (fiat: WasmFiatCurrencySymbol, timestamp?: number) => {
    return timestamp ? `${fiat}${SEPARATOR}${Number(timestamp)}` : fiat;
};
export const parseKey = (key: string) => {
    const [fiat, timestamp] = key.split(SEPARATOR) as [WasmFiatCurrencySymbol, string?];

    return {
        fiat,
        timestamp: timestamp ? Number(timestamp) : undefined,
    };
};

export const getKeyAndTs = (fiat: WasmFiatCurrencySymbol, date?: Date) => {
    const ts = date?.getTime();
    const key = serialiseKey(fiat, ts);

    // API expects ts in seconds
    const tsInSeconds = ts && Math.floor(ts / SECOND);

    return [key, tsInSeconds] as const;
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
                .exchange_rate.getExchangeRate(fiat, ts ? BigInt(ts) : undefined)
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

export const exchangeRateReducer = { [name]: slice.reducer };
export const exchangeRateThunk = modelThunk.thunk;
