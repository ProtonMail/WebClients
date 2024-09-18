import { type WasmApiWalletAccount, WasmScriptType } from '@proton/andromeda';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';

import { apiWalletsData } from '../../tests/fixtures';
import type { IWasmApiWalletData } from '../../types';
import {
    apiWalletsDataReducer,
    selectApiWalletsData,
    walletAccountCreation,
    walletAccountDeletion,
    walletAccountUpdate,
    walletCreation,
    walletDeletion,
    walletUpdate,
} from './apiWalletsData';

describe('apiWalletsData', () => {
    const setup = (data: IWasmApiWalletData[] = apiWalletsData) => {
        const extraThunkArguments = {
            api: async () => {
                return { Domains: [{ ID: '1' }] };
            },
        } as unknown as ProtonThunkArguments;

        return getTestStore({
            reducer: { ...apiWalletsDataReducer } as any,
            preloadedState: {
                api_wallets_data: { value: data, error: undefined },
            },
            extraThunkArguments,
        });
    };

    describe('wallet creation', () => {
        it('should add a wallet to the store', () => {
            const { store } = setup([]);
            store.dispatch(walletCreation(apiWalletsData[0]));
            expect(selectApiWalletsData(store.getState()).value).toStrictEqual([apiWalletsData[0]]);
        });
    });

    describe('wallet deletion', () => {
        it('should remove a wallet from the store', () => {
            const { store } = setup(apiWalletsData);
            store.dispatch(walletDeletion({ walletID: apiWalletsData[1].Wallet.ID }));
            expect(selectApiWalletsData(store.getState()).value).toStrictEqual([apiWalletsData[0], apiWalletsData[2]]);
        });
    });

    describe('wallet name update', () => {
        it('should update the name of the wallet in the store', () => {
            const name = 'My super wallet';
            const { store } = setup(apiWalletsData);
            store.dispatch(walletUpdate({ walletID: apiWalletsData[1].Wallet.ID, update: { Name: name } }));
            expect(selectApiWalletsData(store.getState()).value).toStrictEqual([
                apiWalletsData[0],
                { ...apiWalletsData[1], Wallet: { ...apiWalletsData[1].Wallet, Name: name } },
                apiWalletsData[2],
            ]);
        });
    });

    describe('wallet account creation', () => {
        it('should push a new wallet account in the store', () => {
            const { store } = setup(apiWalletsData);

            const account: WasmApiWalletAccount = {
                WalletID: apiWalletsData[1].Wallet.ID,
                FiatCurrency: 'USD',
                ID: '0008',
                Label: 'Account test 1',
                ScriptType: WasmScriptType.NativeSegwit,
                DerivationPath: "m/84'/0'/0'",
                Addresses: [],
                Priority: 1,
                LastUsedIndex: 0,
                PoolSize: 0,
            };

            store.dispatch(walletAccountCreation(account));

            expect(selectApiWalletsData(store.getState()).value?.[1].WalletAccounts).toStrictEqual([
                ...apiWalletsData[1].WalletAccounts,
                account,
            ]);
        });
    });

    describe('wallet account deletion', () => {
        it('should push a new wallet account in the store', () => {
            const { store } = setup(apiWalletsData);

            store.dispatch(
                walletAccountDeletion({
                    walletID: apiWalletsData[1].Wallet.ID,
                    walletAccountID: apiWalletsData[1].WalletAccounts[0].ID,
                })
            );

            expect(selectApiWalletsData(store.getState()).value?.[1].WalletAccounts).toStrictEqual([
                apiWalletsData[1].WalletAccounts[1],
            ]);
        });
    });

    describe('wallet account update', () => {
        it('should push a new wallet account in the store', () => {
            const { store } = setup(apiWalletsData);

            const account: WasmApiWalletAccount = {
                ...apiWalletsData[1].WalletAccounts[0],
                Label: 'A new test label',
                FiatCurrency: 'EGP',
                Addresses: [{ ID: '00098', Email: 'test@test.com' }],
            };

            store.dispatch(
                walletAccountUpdate({ walletID: account.WalletID, walletAccountID: account.ID, update: account })
            );

            expect(selectApiWalletsData(store.getState()).value?.[1].WalletAccounts).toStrictEqual([
                account,
                apiWalletsData[1].WalletAccounts[1],
            ]);
        });
    });
});
