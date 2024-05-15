import { createSlice } from '@reduxjs/toolkit';
import { add, isBefore } from 'date-fns';

import { ModelState } from '@proton/account';
import { createAsyncModelThunk, handleAsyncModel } from '@proton/redux-utilities';

import { WalletThunkArguments } from '../thunk';

const name = 'bitcoin_address_highest_index' as const;

type HighestIndexByWalletAccountId = Partial<Record<string, { time: number; index: number }>>;
export interface BitcoinAddressHighestIndexState {
    [name]: ModelState<HighestIndexByWalletAccountId>;
}

type SliceState = BitcoinAddressHighestIndexState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectBitcoinAddressHighestIndex = (state: BitcoinAddressHighestIndexState) => state[name];

const modelThunk = createAsyncModelThunk<
    Model,
    BitcoinAddressHighestIndexState,
    WalletThunkArguments,
    [string, string]
>(`${name}/fetch`, {
    miss: async ({ extraArgument, options, getState }) => {
        const stateValue = getState()[name].value;
        if (!options?.thunkArg) {
            return stateValue ?? {};
        }

        const [walletId, walletAccountId] = options?.thunkArg;

        const index = await extraArgument.walletApi
            .clients()
            .bitcoin_address.getBitcoinAddressHighestIndex(walletId, walletAccountId)
            .then((data) => Number(data))
            .catch(() => 0);

        return {
            ...stateValue,
            [walletAccountId]: { index, time: Date.now() },
        };
    },
    previous: ({ getState, options }) => {
        const state = getState()[name].value;

        if (!options?.thunkArg || !state) {
            return undefined;
        }

        const [, walletAccountId] = options?.thunkArg;

        const highestIndexValue = state[walletAccountId];

        const validUntil = highestIndexValue && add(new Date(highestIndexValue.time), { minutes: 10 });
        if (validUntil && isBefore(new Date(), validUntil)) {
            return state;
        }

        return undefined;
    },
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

export const bitcoinAddressHighestIndexReducer = { [name]: slice.reducer };
export const bitcoinAddressHighestIndexThunk = modelThunk.thunk;
