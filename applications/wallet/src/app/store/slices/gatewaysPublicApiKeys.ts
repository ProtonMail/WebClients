import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import type { WalletThunkArguments } from '../thunk';

const name = 'gateways_public_api_keys' as const;

export interface GatewaysPublicApiKeysState {
    [name]: ModelState<{ moonpay: string; ramp: string }>;
}

type SliceState = GatewaysPublicApiKeysState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectGatewaysPublicApiKeys = (state: GatewaysPublicApiKeysState) => state[name];

const modelThunk = createAsyncModelThunk<Model, GatewaysPublicApiKeysState, WalletThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        const moonpay = await extraArgument.walletApi
            .clients()
            .payment_gateway.getPublicApiKey('MoonPay')
            .then((k) => k);

        const ramp = await extraArgument.walletApi
            .clients()
            .payment_gateway.getPublicApiKey('Ramp')
            .then((k) => k);

        return {
            moonpay,
            ramp,
        };
    },
    previous: previousSelector(selectGatewaysPublicApiKeys),
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

export const gatewaysPublicApiKeysReducer = { [name]: slice.reducer };
export const gatewaysPublicApiKeysThunk = modelThunk.thunk;
