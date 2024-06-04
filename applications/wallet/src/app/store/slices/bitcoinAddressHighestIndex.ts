import { createSlice } from '@reduxjs/toolkit';

import { ModelState, getInitialModelState } from '@proton/account';
import { createAsyncModelThunk, getValidModel, handleAsyncModel } from '@proton/redux-utilities';
import { MINUTE } from '@proton/shared/lib/constants';
import { isNotStale } from '@proton/shared/lib/helpers/fetchedAt';

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
        const state = getState()[name];

        if (!options?.thunkArg || !state.value) {
            return undefined;
        }

        const [, walletAccountId] = options?.thunkArg;
        const highestIndexValue = state.value[walletAccountId];

        if (!highestIndexValue) {
            return undefined;
        }

        return getValidModel({
            value: state.value,
            cache: options?.cache ?? (isNotStale(state.meta?.fetchedAt, 10 * MINUTE) ? 'stale' : undefined),
        });
    },
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

export const bitcoinAddressHighestIndexReducer = { [name]: slice.reducer };
export const bitcoinAddressHighestIndexThunk = modelThunk.thunk;
