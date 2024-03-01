import { createAction, createSlice } from '@reduxjs/toolkit';

import { ModelState } from '@proton/account';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import { WasmWalletAccount } from '../../../pkg';
import { IWasmWallet } from '../../types';
import { WalletEventLoop } from '../../types/eventLoop';
import { replaceAt } from '../../utils/array';
import { stateFromWalletAccountEvent, stateFromWalletEvent } from '../../utils/eventLoop';
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

const eventLoopEvent = createAction('server event', (payload: WalletEventLoop) => ({ payload }));

export const walletCreation = createAction('wallet creation', (payload: IWasmWallet) => ({ payload }));
export const walletDeletion = createAction('wallet deletion', (payload: { walletID: string }) => ({ payload }));
// TODO: handle wallet update

export const walletAccountCreation = createAction(
    'wallet account creation',
    (payload: { walletID: string; account: WasmWalletAccount }) => ({ payload })
);
export const walletAccountDeletion = createAction(
    'wallet account deletion',
    (payload: { walletID: string; walletAccountID: string }) => ({ payload })
);
// TODO: handle wallet account update

// TODO: handle wallet settings update

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        // TODO: add event loop event here

        builder
            .addCase(eventLoopEvent, (state, event) => {
                event.payload.Wallets?.forEach((walletEvent) => {
                    if (state.value) {
                        state.value = stateFromWalletEvent(walletEvent, event.payload, state.value);
                    }
                });

                // FIXME: this doesn't work because API doesn't fill WalletID for now
                event.payload.WalletAccounts?.forEach((walletAccountAction) => {
                    if (state.value) {
                        state.value = stateFromWalletAccountEvent(walletAccountAction, state.value);
                    }
                });
            })
            .addCase(walletCreation, (state, action) => {
                if (state.value && !state.value.some(({ Wallet: { ID } }) => ID !== action.payload.Wallet.ID)) {
                    state.value.push(action.payload);
                }
            })
            .addCase(walletDeletion, (state, action) => {
                if (state.value) {
                    state.value = state.value.filter((data) => data.Wallet.ID !== action.payload.walletID);
                }
            })
            .addCase(walletAccountCreation, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);
                    const walletAtIndex = state.value[walletIndex];

                    state.value = replaceAt(state.value, walletIndex, {
                        ...walletAtIndex,
                        WalletAccounts: [...walletAtIndex.WalletAccounts, action.payload.account],
                    });
                }
            })
            .addCase(walletAccountDeletion, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);
                    const walletAtIndex = state.value[walletIndex];

                    state.value = replaceAt(state.value, walletIndex, {
                        ...walletAtIndex,
                        WalletAccounts: walletAtIndex.WalletAccounts.filter(
                            ({ ID }) => ID !== action.payload.walletAccountID
                        ),
                    });
                }
            });
    },
});

export const userWalletsReducer = { [name]: slice.reducer };
export const userWalletsThunk = modelThunk.thunk;
