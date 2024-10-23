import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import { type WasmApiWalletBitcoinAddress } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel } from '@proton/redux-utilities';
import { MINUTE } from '@proton/shared/lib/constants';

import type { WalletThunkArguments } from '../thunk';

const name = 'bitcoin_address_pool' as const;

type BitcoinAddressPoolByWalletAccountId = Partial<Record<string, WasmApiWalletBitcoinAddress[]>>;

export interface BitcoinAddressPoolState {
    [name]: ModelState<BitcoinAddressPoolByWalletAccountId>;
}

type SliceState = BitcoinAddressPoolState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectBitcoinAddressPool = (state: BitcoinAddressPoolState) => state[name];

const modelThunk = createAsyncModelThunk<Model, BitcoinAddressPoolState, WalletThunkArguments, [string, string]>(
    `${name}/fetch`,
    {
        miss: async ({ extraArgument, options, getState }) => {
            const stateValue = getState()[name].value;
            if (!options?.thunkArg) {
                return stateValue ?? {};
            }

            const [walletId, walletAccountId] = options?.thunkArg;

            const addresses = await extraArgument.walletApi
                .clients()
                .bitcoin_address.getBitcoinAddresses(walletId, walletAccountId)
                .then((data) => data[0].map((d): WasmApiWalletBitcoinAddress => d.Data));

            return {
                ...stateValue,
                [walletAccountId]: addresses,
            };
        },
        expiry: 10 * MINUTE,
        previous: ({ getState, options }) => {
            const state = getState()[name];

            if (!options?.thunkArg || !state.value) {
                return undefined;
            }

            const [, walletAccountId] = options?.thunkArg;
            const value = state.value[walletAccountId];

            if (!value) {
                return undefined;
            }

            return state;
        },
    }
);

const initialState = getInitialModelState<Model>();

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const bitcoinAddressPoolReducer = { [name]: slice.reducer };
export const bitcoinAddressPoolThunk = modelThunk.thunk;
