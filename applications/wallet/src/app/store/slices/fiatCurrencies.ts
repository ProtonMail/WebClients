import { createSlice } from '@reduxjs/toolkit';

import { ModelState } from '@proton/account';
import { WasmApiFiatCurrency } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import { WalletThunkArguments } from '../thunk';

const name = 'fiat_currencies' as const;

export interface FiatCurrenciesState {
    [name]: ModelState<WasmApiFiatCurrency[]>;
}

type SliceState = FiatCurrenciesState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectSortedFiatCurrencies = (state: FiatCurrenciesState) => {
    const cloned = state[name]?.value ? [...state[name]?.value] : undefined;
    cloned?.sort((a, b) => (a.Symbol > b.Symbol ? 1 : -1));
    return { ...state[name], value: cloned };
};

const modelThunk = createAsyncModelThunk<Model, FiatCurrenciesState, WalletThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.walletApi
            .exchange_rate()
            .getAllFiatCurrencies()
            .then((currencies) => currencies[0].map((c) => c.Data));
    },
    previous: previousSelector(selectSortedFiatCurrencies),
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

export const fiatCurrenciesReducer = { [name]: slice.reducer };
export const fiatCurrenciesThunk = modelThunk.thunk;
