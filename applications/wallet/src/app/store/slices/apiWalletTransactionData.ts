import { createSlice } from '@reduxjs/toolkit';
import { uniqBy } from 'lodash';

import { ModelState } from '@proton/account';
import { WasmApiWalletTransactionData } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel } from '@proton/redux-utilities';

import { WalletThunkArguments } from '../thunk';

const name = 'api_wallet_transaction_data' as const;

export interface ApiWalletTransactionDataState {
    [name]: ModelState<WasmApiWalletTransactionData[]>;
}

type SliceState = ApiWalletTransactionDataState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectApiWalletTransactionData = (state: ApiWalletTransactionDataState) => state[name];

const modelThunk = createAsyncModelThunk<
    Model,
    ApiWalletTransactionDataState,
    WalletThunkArguments,
    [string, string?, string[]?]
>(`${name}/fetch`, {
    miss: async ({ extraArgument, options, getState }) => {
        if (!options?.thunkArg) {
            return Promise.resolve([]);
        }

        const [walletId, walletAccountId, hashedTxIds] = options.thunkArg;

        const data = await extraArgument.walletApi
            .wallet()
            .getWalletTransactions(walletId, walletAccountId, hashedTxIds)
            .then((data) => data[0]);

        const state = getState()[name].value;

        return uniqBy([...(state ?? []), ...data], ({ Data }) => Data.HashedTransactionID);
    },
    previous: (extra) => {
        const state = extra.getState()[name].value;

        if (!extra.options?.thunkArg) {
            return { value: undefined, error: undefined };
        }

        const hashedTxIds = extra.options.thunkArg[2];
        const cachedTxIds = state?.filter((tx) => hashedTxIds?.includes(tx.Data.HashedTransactionID ?? ''));
        if (hashedTxIds?.length === cachedTxIds?.length) {
            return { value: state, error: undefined };
        }

        return { value: undefined, error: undefined };
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

export const apiWalletTransactionDataReducer = { [name]: slice.reducer };
export const apiWalletTransactionDataThunk = modelThunk.thunk;
