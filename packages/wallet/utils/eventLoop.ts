import { createAction } from '@reduxjs/toolkit';
import compact from 'lodash/compact';

import type { WasmApiWalletAccount, WasmApiWalletKey, WasmApiWalletSettings } from '@proton/andromeda';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { type CreateEventItemUpdate } from '@proton/shared/lib/helpers/updateCollection';
import { type DecryptedKey } from '@proton/shared/lib/interfaces';

import type { IWasmApiWalletData } from '../types';
import type { WalletAccountEvent, WalletEvent, WalletEventLoop } from '../types/eventLoop';
import { replaceAt } from './array';
import { decryptWallet } from './wallet';

export const eventLoopEvent = createAction<WalletEventLoop>('server event');

const findCreatedWalletKeyFromEvents = (walletID: string, events: WalletEventLoop) => {
    return events.WalletKeys?.find(
        (walletKeyAction): walletKeyAction is CreateEventItemUpdate<WasmApiWalletKey, 'WalletKey'> =>
            walletKeyAction.Action === EVENT_ACTIONS.CREATE && walletKeyAction.WalletKey.WalletID === walletID
    )?.WalletKey;
};

const findCreatedWalletSettingsFromEvents = (walletID: string, events: WalletEventLoop) => {
    return events.WalletSettings?.find(
        (walletKeyAction): walletKeyAction is CreateEventItemUpdate<WasmApiWalletSettings, 'WalletSettings'> =>
            walletKeyAction.Action === EVENT_ACTIONS.CREATE && walletKeyAction.WalletSettings.WalletID === walletID
    )?.WalletSettings;
};

const findCreatedWalletAccountsFromEvents = (walletID: string, events: WalletEventLoop) => {
    return (
        events.WalletAccounts?.filter(
            (
                walletAccountsAction
            ): walletAccountsAction is CreateEventItemUpdate<WasmApiWalletAccount, 'WalletAccount'> =>
                walletAccountsAction.Action === EVENT_ACTIONS.CREATE &&
                walletAccountsAction.WalletAccount.WalletID === walletID
        ).map((walletAccountsAction) => walletAccountsAction.WalletAccount) ?? []
    );
};

export const stateFromWalletEvent = (
    walletEvent: WalletEvent,
    eventLoop: WalletEventLoop,
    currentApiWalletsData: IWasmApiWalletData[],
    userKeys: DecryptedKey[]
): Promise<IWasmApiWalletData[]> => {
    switch (walletEvent.Action) {
        case EVENT_ACTIONS.CREATE:
            return (async () => {
                if (currentApiWalletsData.some((data) => data.Wallet.ID === walletEvent.ID)) {
                    return currentApiWalletsData;
                }

                // WalletKey and WalletSettings should be create at the same time
                const walletKey = findCreatedWalletKeyFromEvents(walletEvent.ID, eventLoop);
                const walletSettings = findCreatedWalletSettingsFromEvents(walletEvent.ID, eventLoop);
                const walletAccounts = findCreatedWalletAccountsFromEvents(walletEvent.ID, eventLoop);

                const apiWalletData = {
                    Wallet: walletEvent.Wallet,
                    WalletKey: walletKey,
                    WalletSettings: walletSettings,
                    WalletAccounts: walletAccounts,
                };

                const wallet = await decryptWallet({
                    apiWalletData,
                    userKeys,
                });

                return compact([...currentApiWalletsData, wallet]);
            })();
        case EVENT_ACTIONS.UPDATE:
            return (async () => {
                const index = currentApiWalletsData.findIndex((wallet) => wallet.Wallet.ID === walletEvent.ID);

                const apiWalletData = {
                    ...currentApiWalletsData[index],
                    Wallet: { ...currentApiWalletsData[index].Wallet, ...walletEvent.Wallet },
                };

                const wallet = await decryptWallet({
                    apiWalletData,
                    userKeys,
                });

                if (index && index > -1) {
                    return compact(replaceAt(currentApiWalletsData, index, wallet));
                }

                return compact(currentApiWalletsData);
            })();
        case EVENT_ACTIONS.DELETE:
            return Promise.resolve(
                currentApiWalletsData.filter((walletData) => walletData.Wallet.ID != walletEvent.ID)
            );
        default:
            return Promise.resolve(currentApiWalletsData);
    }
};

export const stateFromWalletAccountEvent = (
    walletAccountEvent: WalletAccountEvent,
    currentWallets: IWasmApiWalletData[],
    userKeys: DecryptedKey[]
): Promise<IWasmApiWalletData[]> => {
    switch (walletAccountEvent.Action) {
        case EVENT_ACTIONS.CREATE:
            return (async () => {
                const index = currentWallets.findIndex(
                    (wallet) => wallet.Wallet.ID === walletAccountEvent.WalletAccount.WalletID
                );

                const apiWalletData = {
                    ...currentWallets[index],
                    WalletAccounts: [...currentWallets[index].WalletAccounts, walletAccountEvent.WalletAccount],
                };

                const wallet = await decryptWallet({
                    apiWalletData,
                    userKeys,
                });

                if (index && index > -1) {
                    replaceAt(currentWallets, index, wallet);
                }

                return Promise.resolve(currentWallets);
            })();
        case EVENT_ACTIONS.UPDATE:
            return (async () => {
                const walletIndex = currentWallets.findIndex(
                    (wallet) => wallet.Wallet.ID === walletAccountEvent.WalletAccount.WalletID
                );

                const walletAtIndex = currentWallets[walletIndex];

                if (walletAtIndex) {
                    const accountIndex = walletAtIndex.WalletAccounts.findIndex(
                        (walletAccount) => walletAccount.ID === walletAccountEvent.ID
                    );

                    const apiWalletData = {
                        ...walletAtIndex,
                        WalletAccounts: replaceAt(walletAtIndex.WalletAccounts, accountIndex, {
                            ...walletAtIndex.WalletAccounts[accountIndex],
                            ...walletAccountEvent.WalletAccount,
                        }),
                    };

                    const wallet = await decryptWallet({
                        apiWalletData,
                        userKeys,
                    });

                    if (accountIndex > -1) {
                        return compact(replaceAt(currentWallets, walletIndex, wallet));
                    }
                }

                return Promise.resolve(currentWallets);
            })();
        case EVENT_ACTIONS.DELETE:
            return Promise.resolve(
                currentWallets.map(({ WalletAccounts, ...rest }) => ({
                    ...rest,
                    WalletAccounts: WalletAccounts.filter(
                        (walletAccount) => walletAccount.ID !== walletAccountEvent.ID
                    ),
                }))
            );
    }
};
