import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import { createAsyncModelThunk, handleAsyncModel } from '@proton/redux-utilities';
import { MINUTE } from '@proton/shared/lib/constants';
import type { SimpleMap } from '@proton/shared/lib/interfaces';

import type { WalletThunkArguments } from '../thunk';

const name = 'bitcoin_address_used_indexes' as const;

type UsedIndexesByWalletAccountId = SimpleMap<bigint[]>;
export interface BitcoinAddressUsedIndexesState {
    [name]: ModelState<UsedIndexesByWalletAccountId>;
}

type SliceState = BitcoinAddressUsedIndexesState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectBitcoinAddressUsedIndexes = (state: BitcoinAddressUsedIndexesState) => state[name];

const modelThunk = createAsyncModelThunk<Model, BitcoinAddressUsedIndexesState, WalletThunkArguments, [string, string]>(
    `${name}/fetch`,
    {
        miss: async ({ extraArgument, options, getState }) => {
            const stateValue = getState()[name].value;
            if (!options?.thunkArg) {
                return stateValue ?? {};
            }

            const [walletId, walletAccountId] = options?.thunkArg;

            const usedIndexes = await extraArgument.walletApi
                .clients()
                .bitcoin_address.getUsedIndexes(walletId, walletAccountId)
                .then((data) => data[0].map((d) => d.Data))
                .catch(() => []);

            return {
                ...stateValue,
                [walletAccountId]: usedIndexes,
            };
        },
        expiry: 10 * MINUTE,
        previous: ({ getState, options }) => {
            const state = getState()[name];

            if (!options?.thunkArg || !state.value) {
                return undefined;
            }

            const [, walletAccountId] = options?.thunkArg;
            const usedIndexes = state.value[walletAccountId];

            if (!usedIndexes) {
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

export const bitcoinAddressUsedIndexesReducer = { [name]: slice.reducer };
export const bitcoinAddressUsedIndexesThunk = modelThunk.thunk;
