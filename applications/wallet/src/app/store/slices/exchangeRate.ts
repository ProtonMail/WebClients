import { createSlice } from '@reduxjs/toolkit';

import { ModelState } from '@proton/account';
import { WasmApiExchangeRate, WasmFiatCurrency } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { SECOND } from '@proton/shared/lib/constants';

import { WalletThunkArguments } from '../thunk';

const name = 'exchange_rate' as const;

export interface ExchangeRateState {
    [name]: ModelState<WasmApiExchangeRate>;
}

type SliceState = ExchangeRateState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectExchangeRate = (state: ExchangeRateState) => state[name];

const modelThunk = createAsyncModelThunk<Model, ExchangeRateState, WalletThunkArguments, [WasmFiatCurrency?, Date?]>(
    `${name}/fetch`,
    {
        miss: ({ extraArgument, options }) => {
            const fiat = options?.thunkArg?.[0] ?? 'USD';
            const date = options?.thunkArg?.[1] ?? new Date();

            return extraArgument.walletApi
                .exchange_rate()
                .getExchangeRate(fiat, BigInt(Math.floor(date.getTime() / SECOND)))
                .then((data) => data[0]);
        },
        previous: previousSelector(selectExchangeRate),
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
