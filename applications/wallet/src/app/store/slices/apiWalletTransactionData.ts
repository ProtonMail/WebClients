import { createSlice } from '@reduxjs/toolkit';
import { uniqBy } from 'lodash';

import { ModelState, getInitialModelState } from '@proton/account';
import { WasmApiWalletTransactionData } from '@proton/andromeda';
import { createAsyncModelThunk, getValidModel, handleAsyncModel } from '@proton/redux-utilities';

import { WalletThunkArguments } from '../thunk';

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
    previous: (extra) => {
        const state = extra.getState()[apiWalletTransactionDataSliceName].value;

        if (!extra.options?.thunkArg) {
            return undefined;
        }

        const hashedTxIds = extra.options.thunkArg[2];
        const cachedTxIds = state?.filter((tx) => hashedTxIds?.includes(tx.Data.HashedTransactionID ?? ''));
        if (hashedTxIds?.length === cachedTxIds?.length) {
            return getValidModel({ value: state });
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
