import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState } from '@proton/account';
import type { WasmNetwork } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import type { WalletThunkArguments } from '../thunk';

const name = 'bitcoin_network' as const;

export interface BitcoinNetworkState {
    [name]: ModelState<WasmNetwork>;
}

type SliceState = BitcoinNetworkState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectBitcoinNetwork = (state: BitcoinNetworkState) => state[name];

const modelThunk = createAsyncModelThunk<Model, BitcoinNetworkState, WalletThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.walletApi
            .clients()
            .network.getNetwork()
            .then((network) => network);
    },
    previous: previousSelector(selectBitcoinNetwork),
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

export const bitcoinNetworkReducer = { [name]: slice.reducer };
export const bitcoinNetworkThunk = modelThunk.thunk;
