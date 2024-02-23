import { createSlice } from '@reduxjs/toolkit';

import { ModelState } from '@proton/account';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import { WasmNetwork } from '../../../pkg';
import { WalletThunkArguments } from '../thunk';

const name = 'bitcoinNetwork' as const;

export interface BitcoinNetworkState {
    [name]: ModelState<WasmNetwork>;
}

type SliceState = BitcoinNetworkState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectBitcoinNetwork = (state: BitcoinNetworkState) => state[name];

const modelThunk = createAsyncModelThunk<Model, BitcoinNetworkState, WalletThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.rustApi
            .network()
            .getNetwork()
            .then((network) => network);
    },
    previous: previousSelector(selectBitcoinNetwork),
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

export const bitcoinNetworkReducer = { [name]: slice.reducer };
export const bitcoinNetworkThunk = modelThunk.thunk;
