import { createAction, createSlice } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type ModelState, getInitialModelState } from '@proton/account';
import type { WasmApiWalletAccount, WasmApiWalletSettings } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import type { IWasmApiWalletData, WalletEventLoop } from '../../types';
import { stateFromWalletAccountEvent, stateFromWalletEvent } from '../../utils';
import type { WalletThunkArguments } from '../thunk';

export const apiWalletsDataSliceName = 'api_wallets_data' as const;

export interface ApiWalletsDataState {
    [apiWalletsDataSliceName]: ModelState<IWasmApiWalletData[] | null>;
}

type SliceState = ApiWalletsDataState[typeof apiWalletsDataSliceName];
type Model = SliceState['value'];

export const selectApiWalletsData = (state: ApiWalletsDataState) => state[apiWalletsDataSliceName];

const modelThunk = createAsyncModelThunk<Model, ApiWalletsDataState, WalletThunkArguments>(
    `${apiWalletsDataSliceName}/fetch`,
    {
        miss: ({ extraArgument }) => {
            const { walletApi, notificationsManager } = extraArgument;

            return walletApi
                .clients()
                .wallet.getWallets()
                .then(async (payload) => {
                    const wallets = payload[0];

                    return Promise.all(
                        wallets.map(async ({ Wallet, WalletKey, WalletSettings }) => {
                            const accounts: WasmApiWalletAccount[] = await extraArgument.walletApi
                                .clients()
                                .wallet.getWalletAccounts(Wallet.ID)
                                .then((accounts) => accounts[0].map((accountPayload) => accountPayload.Data))
                                .catch(() => []);

                            return {
                                Wallet: Wallet,
                                WalletKey: WalletKey,
                                WalletSettings: WalletSettings,
                                WalletAccounts: accounts,
                            };
                        })
                    );
                })
                .catch((error: any) => {
                    notificationsManager.createNotification({
                        type: 'error',
                        text: error?.error ?? c('Wallet').t`Could not fetch wallets data`,
                    });

                    return null;
                });
        },
        previous: previousSelector(selectApiWalletsData),
    }
);

const initialState = getInitialModelState<Model>();
const eventLoopEvent = createAction('server event', (payload: WalletEventLoop) => ({ payload }));

export const walletCreation = createAction('wallet creation', (payload: IWasmApiWalletData) => ({ payload }));
export const walletDeletion = createAction('wallet deletion', (payload: { walletID: string }) => ({ payload }));
export const walletNameUpdate = createAction('wallet name update', (payload: { walletID: string; name: string }) => ({
    payload,
}));
export const disabledWalletShowRecovery = createAction(
    'wallet disable show recovery',
    (payload: { walletID: string }) => ({
        payload,
    })
);

export const walletAccountCreation = createAction('wallet account creation', (payload: WasmApiWalletAccount) => ({
    payload,
}));
export const walletAccountUpdate = createAction('wallet account update', (payload: WasmApiWalletAccount) => ({
    payload,
}));
export const walletAccountDeletion = createAction(
    'wallet account deletion',
    (payload: { walletID: string; walletAccountID: string }) => ({ payload })
);

const slice = createSlice({
    name: apiWalletsDataSliceName,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);

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
                if (state.value && !state.value.some(({ Wallet: { ID } }) => ID === action.payload.Wallet.ID)) {
                    state.value.push(action.payload);
                }
            })
            .addCase(walletDeletion, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);
                    state.value.splice(walletIndex, 1);
                }
            })
            .addCase(walletNameUpdate, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);
                    state.value[walletIndex].Wallet.Name = action.payload.name;
                }
            })
            .addCase(disabledWalletShowRecovery, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);

                    if (state.value[walletIndex].WalletSettings) {
                        (state.value[walletIndex].WalletSettings as WasmApiWalletSettings).ShowWalletRecovery = false;
                    }
                }
            })
            .addCase(walletAccountCreation, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.WalletID);
                    state.value[walletIndex].WalletAccounts.push(action.payload);
                }
            })
            .addCase(walletAccountUpdate, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.WalletID);
                    const walletAtIndex = state.value[walletIndex];

                    const walletAccountIndex = walletAtIndex.WalletAccounts.findIndex(
                        (data) => data.ID === action.payload.ID
                    );

                    state.value[walletIndex].WalletAccounts[walletAccountIndex] = action.payload;
                }
            })
            .addCase(walletAccountDeletion, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);
                    const walletAtIndex = state.value[walletIndex];

                    const walletAccountIndex = walletAtIndex.WalletAccounts.findIndex(
                        (data) => data.ID === action.payload.walletAccountID
                    );

                    state.value[walletIndex].WalletAccounts.splice(walletAccountIndex, 1);
                }
            });
    },
});

export const apiWalletsDataReducer = { [apiWalletsDataSliceName]: slice.reducer };
export const apiWalletsDataThunk = modelThunk.thunk;
