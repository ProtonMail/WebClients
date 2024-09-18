import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import type { WasmApiSimpleFiatCurrency, WasmGatewayProvider } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import type { WalletThunkArguments } from '../thunk';

const name = 'fiat_currencies_by_provider' as const;

export type FiatCurrenciesByProvider = Partial<Record<WasmGatewayProvider, WasmApiSimpleFiatCurrency[]>>;

export interface FiatCurrenciesByProviderState {
    [name]: ModelState<FiatCurrenciesByProvider>;
}

type SliceState = FiatCurrenciesByProviderState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectFiatCurrenciesByProvider = (state: FiatCurrenciesByProviderState) => state[name];

const modelThunk = createAsyncModelThunk<Model, FiatCurrenciesByProviderState, WalletThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.walletApi
            .clients()
            .payment_gateway.getFiatCurrencies()
            .then((fiatCurrencies) => {
                return fiatCurrencies.data.reduce((acc: FiatCurrenciesByProvider, current) => {
                    const provider = current[0];
                    const fiatCurrencies = current[1];

                    return { ...acc, [provider]: fiatCurrencies.data };
                }, {});
            });
    },
    previous: previousSelector(selectFiatCurrenciesByProvider),
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

export const fiatCurrenciesByProviderReducer = { [name]: slice.reducer };
export const fiatCurrenciesByProviderThunk = modelThunk.thunk;
