import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import type { WasmApiCountry, WasmGatewayProvider } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import type { WalletThunkArguments } from '../thunk';

const name = 'countries_by_provider' as const;

type CountriesByProvider = Partial<Record<WasmGatewayProvider, WasmApiCountry[]>>;

export interface CountriesByProviderState {
    [name]: ModelState<CountriesByProvider>;
}

type SliceState = CountriesByProviderState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectCountriesByProvider = (state: CountriesByProviderState) => {
    return state[name];
};

const modelThunk = createAsyncModelThunk<Model, CountriesByProviderState, WalletThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.walletApi
            .clients()
            .payment_gateway.getCountries()
            .then((countries) => {
                return countries.data.reduce((acc, current) => {
                    const provider = current[0];
                    const countries = current[1];

                    return { ...acc, [provider]: countries.data };
                }, {} as CountriesByProvider);
            });
    },
    previous: previousSelector(selectCountriesByProvider),
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

export const countriesByProviderReducer = { [name]: slice.reducer };
export const countriesByProviderThunk = modelThunk.thunk;
