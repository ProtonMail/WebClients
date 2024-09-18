import { type ThunkDispatch, type UnknownAction, createAction, createSlice } from '@reduxjs/toolkit';
import compact from 'lodash/compact';
import { c } from 'ttag';

import {
    type AddressKeysState,
    type ModelState,
    type UserKeysState,
    dispatchGetAllAddressesKeys,
    getInitialModelState,
    userKeysThunk,
} from '@proton/account';
import type { WasmApiWalletAccount, WasmApiWalletSettings } from '@proton/andromeda';
import { type ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import type { IWasmApiWalletData } from '../../types';
import { decryptWallet, migrateWallet } from '../../utils';
import type { WalletThunkArguments } from '../thunk';

export const apiWalletsDataSliceName = 'api_wallets_data' as const;

export interface ApiWalletsDataState extends UserKeysState, AddressKeysState {
    [apiWalletsDataSliceName]: ModelState<IWasmApiWalletData[]>;
}

type SliceState = ApiWalletsDataState[typeof apiWalletsDataSliceName];
type Model = NonNullable<SliceState['value']>;

export const selectApiWalletsData = (state: ApiWalletsDataState) => state[apiWalletsDataSliceName];

const fetchAndDecryptWallets = async ({
    extraArgument,
    getState,
    dispatch,
}: {
    extraArgument: WalletThunkArguments;
    getState: () => ApiWalletsDataState;
    dispatch: ThunkDispatch<ApiWalletsDataState, ProtonThunkArguments, UnknownAction>;
}) => {
    const { walletApi, notificationsManager } = extraArgument;
    const walletClient = walletApi.clients().wallet;

    const userKeys = await dispatch(userKeysThunk());
    const addressKeys = await dispatchGetAllAddressesKeys(dispatch);

    return walletClient
        .getWallets()
        .then(async (payload): Promise<IWasmApiWalletData[]> => {
            const wallets = payload[0];
            let didMigration = false;

            const decryptedWallets = await Promise.all(
                wallets.map(async ({ Wallet, WalletKey, WalletSettings }) => {
                    const accounts: WasmApiWalletAccount[] = await walletClient
                        .getWalletAccounts(Wallet.ID)
                        .then((accounts) => accounts[0].map((accountPayload) => accountPayload.Data))
                        .catch(() => []);

                    const apiWalletData = {
                        Wallet: Wallet,
                        WalletKey: WalletKey,
                        WalletSettings: WalletSettings,
                        WalletAccounts: accounts,
                    };

                    const decrypted = await decryptWallet({ apiWalletData, userKeys });

                    if (decrypted?.Wallet.MigrationRequired) {
                        await migrateWallet({ wallet: decrypted, walletApi, userKeys, addressKeys });
                        didMigration = true;
                    }

                    return decrypted;
                })
            );

            if (didMigration) {
                return fetchAndDecryptWallets({ extraArgument, getState, dispatch });
            }

            return compact(decryptedWallets);
        })
        .catch((error: any) => {
            notificationsManager.createNotification({
                type: 'error',
                text: error?.error ?? c('Wallet').t`Could not fetch wallets data`,
            });

            throw error;
        });
};

const modelThunk = createAsyncModelThunk<Model, ApiWalletsDataState, WalletThunkArguments>(
    `${apiWalletsDataSliceName}/fetch`,
    {
        miss: async ({ extraArgument, getState, dispatch }) => {
            return fetchAndDecryptWallets({ extraArgument, getState, dispatch });
        },
        previous: previousSelector(selectApiWalletsData),
    }
);

const initialState = getInitialModelState<Model>();

// Wallet actions
export const setWallets = createAction('wallet/set', (payload: IWasmApiWalletData[]) => ({ payload }));

export const walletCreation = createAction('wallet/create', (payload: IWasmApiWalletData) => ({ payload }));
export const setWalletPassphrase = createAction(
    'wallet/set-passphrase',
    (payload: { walletID: string; passphrase: string }) => ({
        payload,
    })
);
export const walletUpdate = createAction(
    'wallet/update',
    (payload: { walletID: string; update: Partial<IWasmApiWalletData['Wallet']> }) => ({
        payload,
    })
);
export const walletDeletion = createAction('wallet/delete', (payload: { walletID: string }) => ({ payload }));

export const disableWalletShowRecovery = createAction(
    'wallet disable show recovery',
    (payload: { walletID: string }) => ({
        payload,
    })
);

// Wallet account actions
export const walletAccountCreation = createAction('wallet-account/create', (payload: WasmApiWalletAccount) => ({
    payload,
}));
export const walletAccountDeletion = createAction(
    'wallet-account/delete',
    (payload: { walletID: string; walletAccountID: string }) => ({ payload })
);
export const walletAccountUpdate = createAction(
    'wallet-account/update',
    (payload: { walletID: string; walletAccountID: string; update: Partial<WasmApiWalletAccount> }) => ({
        payload,
    })
);

const slice = createSlice({
    name: apiWalletsDataSliceName,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);

        builder
            .addCase(walletCreation, (state, action) => {
                if (state.value && !state.value.some(({ Wallet: { ID } }) => ID === action.payload.Wallet.ID)) {
                    state.value.push(action.payload);
                }
            })
            .addCase(setWalletPassphrase, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);
                    state.value[walletIndex].Wallet.Passphrase = action.payload.passphrase;
                }
            })
            .addCase(walletDeletion, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);
                    state.value.splice(walletIndex, 1);
                }
            })
            .addCase(walletUpdate, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);

                    state.value[walletIndex].Wallet = {
                        ...state.value[walletIndex].Wallet,
                        ...action.payload.update,
                    };
                }
            })
            .addCase(disableWalletShowRecovery, (state, action) => {
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
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);
                    const walletAtIndex = state.value[walletIndex];

                    const walletAccountIndex = walletAtIndex.WalletAccounts.findIndex(
                        (data) => data.ID === action.payload.walletAccountID
                    );

                    state.value[walletIndex].WalletAccounts[walletAccountIndex] = {
                        ...state.value[walletIndex].WalletAccounts[walletAccountIndex],
                        ...action.payload.update,
                    };
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
