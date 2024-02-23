import { createSlice } from '@reduxjs/toolkit';

import { ModelState } from '@proton/account';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import { IWasmWallet } from '../../types';
import { WalletThunkArguments } from '../thunk';

export const name = 'user_wallets' as const;

export interface UserWalletsState {
    [name]: ModelState<IWasmWallet[]>;
}

type SliceState = UserWalletsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectUserWallets = (state: UserWalletsState) => state[name];

const modelThunk = createAsyncModelThunk<Model, UserWalletsState, WalletThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.rustApi
            .wallet()
            .getWallets()
            .then(async (payload) => {
                const wallets = payload[0];

                return Promise.all(
                    wallets.map(async (wallet) => {
                        const accounts = await extraArgument.rustApi
                            .wallet()
                            .getWalletAccounts(wallet.Wallet.ID)
                            .then((accounts) => accounts[0].map((accountPayload) => accountPayload.Account))
                            .catch(() => []);

                        return {
                            Wallet: wallet.Wallet,
                            WalletKey: wallet.WalletKey,
                            WalletSettings: wallet.WalletSettings,
                            WalletAccounts: accounts,
                        };
                    })
                );
            });
    },
    previous: previousSelector(selectUserWallets),
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
        // TODO: add event loop event here
    },
});

export const userWalletsReducer = { [name]: slice.reducer };
export const userWalletsThunk = modelThunk.thunk;
