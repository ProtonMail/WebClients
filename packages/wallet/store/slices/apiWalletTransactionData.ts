import { createSlice } from '@reduxjs/toolkit';
import uniqBy from 'lodash/uniqBy';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import type { WasmApiWalletTransactionData } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel } from '@proton/redux-utilities';

import type { WalletThunkArguments } from '../thunk';

export const apiWalletTransactionDataSliceName = 'api_wallet_transaction_data' as const;

export interface ApiWalletTransactionDataState {
    [apiWalletTransactionDataSliceName]: ModelState<WasmApiWalletTransactionData[]>;
}

type SliceState = ApiWalletTransactionDataState[typeof apiWalletTransactionDataSliceName];
type Model = NonNullable<SliceState['value']>;

export const selectApiWalletTransactionData = (state: ApiWalletTransactionDataState) =>
    state[apiWalletTransactionDataSliceName];

const modelThunk = createAsyncModelThunk<
    Model,
    ApiWalletTransactionDataState,
    WalletThunkArguments,
    [string, string?, string[]?]
>(`${apiWalletTransactionDataSliceName}/fetch`, {
    miss: async ({ extraArgument, options, getState }) => {
        if (!options?.thunkArg) {
            return Promise.resolve([]);
        }

        const [walletId, walletAccountId, hashedTxIds] = options.thunkArg;

        const data = await extraArgument.walletApi
            .clients()
            .wallet.getWalletTransactions(walletId, walletAccountId, hashedTxIds)
            .then((data) => data[0]);

        const state = getState()[apiWalletTransactionDataSliceName].value;

        return uniqBy([...(state ?? []), ...data], ({ Data }) => Data.HashedTransactionID);
    },
    previous: ({ options, getState }) => {
        const state = getState()[apiWalletTransactionDataSliceName];
        const stateValue = state.value;

        if (!options?.thunkArg) {
            return undefined;
        }

        const hashedTxIds = options.thunkArg[2];
        const cachedTxIds = stateValue?.filter((tx) => hashedTxIds?.includes(tx.Data.HashedTransactionID ?? ''));

        if (hashedTxIds?.length === cachedTxIds?.length) {
            return state;
        }

        return undefined;
    },
});

const initialState = getInitialModelState<Model>();

const slice = createSlice({
    name: apiWalletTransactionDataSliceName,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const apiWalletTransactionDataReducer = { [apiWalletTransactionDataSliceName]: slice.reducer };
export const apiWalletTransactionDataThunk = modelThunk.thunk;
