import { createSlice } from '@reduxjs/toolkit';

import { ModelState } from '@proton/account';
import { WasmApiExchangeRate, WasmFiatCurrency } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel } from '@proton/redux-utilities';
import { SECOND } from '@proton/shared/lib/constants';

import { WalletThunkArguments } from '../thunk';

const name = 'exchange_rate' as const;

type WasmApiExchangeRateByFiat = Partial<Record<WasmFiatCurrency, WasmApiExchangeRate>>;

export interface ExchangeRateState {
    [name]: ModelState<WasmApiExchangeRateByFiat>;
}

type SliceState = ExchangeRateState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectExchangeRate = (state: ExchangeRateState) => {
    return state[name];
};

const modelThunk = createAsyncModelThunk<Model, ExchangeRateState, WalletThunkArguments, [WasmFiatCurrency, Date?]>(
    `${name}/fetch`,
    {
        miss: async ({ extraArgument, options, getState }) => {
            const stateValue = getState()[name].value;
            if (!options?.thunkArg) {
                return stateValue ?? {};
            }

            const fiat = options?.thunkArg?.[0] ?? 'USD';
            const date = options?.thunkArg?.[1] ?? new Date();

            try {
                const exchangeRate = await extraArgument.walletApi
                    .exchange_rate()
                    .getExchangeRate(fiat, BigInt(Math.floor(date.getTime() / SECOND)))
                    .then((data) => {
                        return data[0];
                    });

                return {
                    ...stateValue,
                    [fiat]: exchangeRate,
                };
            } catch {
                return stateValue ?? {};
            }
        },
        previous: ({ getState, options }) => {
            const state = getState()[name].value;

            if (!options?.thunkArg?.[0] || !state) {
                return { value: undefined, error: undefined };
            }

            const [fiat] = options?.thunkArg;
            if (state[fiat]) {
                return { value: state, error: undefined };
            }

            return { value: undefined, error: undefined };
        },
    }
);

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
