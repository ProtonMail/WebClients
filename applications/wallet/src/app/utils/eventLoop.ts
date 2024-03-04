import { WasmApiWalletAccount, WasmApiWalletKey, WasmApiWalletSettings } from '@proton/andromeda';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { CreateEventItemUpdate } from '@proton/shared/lib/helpers/updateCollection';

import { IWasmApiWalletData } from '../types';
import { WalletAccountEvent, WalletEvent, WalletEventLoop } from '../types/eventLoop';
import { replaceAt } from './array';

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
    currentApiWalletsData: IWasmApiWalletData[]
) => {
    switch (walletEvent.Action) {
        case EVENT_ACTIONS.CREATE:
            if (currentApiWalletsData.some((data) => data.Wallet.ID === walletEvent.ID)) {
                return currentApiWalletsData;
            }

            const walletKey = findCreatedWalletKeyFromEvents(walletEvent.ID, eventLoop);
            const walletSettings = findCreatedWalletSettingsFromEvents(walletEvent.ID, eventLoop);
            const walletAccounts = findCreatedWalletAccountsFromEvents(walletEvent.ID, eventLoop);

            // WalletKey and WalletSettings should be create at the same time
            return [
                ...currentApiWalletsData,
                {
                    Wallet: walletEvent.Wallet,
                    WalletKey: walletKey,
                    WalletSettings: walletSettings,
                    WalletAccounts: walletAccounts,
                },
            ];
        case EVENT_ACTIONS.UPDATE:
            const index = currentApiWalletsData.findIndex((wallet) => wallet.Wallet.ID === walletEvent.ID);
            if (index && index > -1) {
                return replaceAt(currentApiWalletsData, index, {
                    ...currentApiWalletsData[index],
                    Wallet: { ...currentApiWalletsData[index].Wallet, ...walletEvent.Wallet },
                });
            }

            return currentApiWalletsData;
        case EVENT_ACTIONS.DELETE:
            return currentApiWalletsData?.filter((walletData) => walletData.Wallet.ID != walletEvent.ID);
        default:
            return currentApiWalletsData;
    }
};

export const stateFromWalletAccountEvent = (
    walletAccountEvent: WalletAccountEvent,
    currentWallets: IWasmApiWalletData[]
) => {
    switch (walletAccountEvent.Action) {
        case EVENT_ACTIONS.DELETE:
            return currentWallets.map(({ WalletAccounts, ...rest }) => ({
                ...rest,
                WalletAccounts: WalletAccounts.filter((walletAccount) => walletAccount.ID !== walletAccountEvent.ID),
            }));

        case EVENT_ACTIONS.CREATE:
            const index = currentWallets.findIndex(
                (wallet) => wallet.Wallet.ID === walletAccountEvent.WalletAccount.WalletID
            );

            if (index > -1) {
                const walletAtIndex = currentWallets[index];

                replaceAt(currentWallets, index, {
                    ...walletAtIndex,
                    WalletAccounts: [...walletAtIndex.WalletAccounts, walletAccountEvent.WalletAccount],
                });
            }

            break;
        case EVENT_ACTIONS.UPDATE:
            const walletIndex = currentWallets.findIndex(
                (wallet) => wallet.Wallet.ID === walletAccountEvent.WalletAccount.WalletID
            );

            const walletAtIndex = currentWallets[walletIndex];

            if (walletAtIndex) {
                const accountIndex = walletAtIndex.WalletAccounts.findIndex(
                    (walletAccount) => walletAccount.ID === walletAccountEvent.ID
                );

                if (accountIndex > -1) {
                    return replaceAt(currentWallets, walletIndex, {
                        ...walletAtIndex,
                        WalletAccounts: replaceAt(walletAtIndex.WalletAccounts, accountIndex, {
                            ...walletAtIndex.WalletAccounts[accountIndex],
                            ...walletAccountEvent.WalletAccount,
                        }),
                    });
                }
            }

            break;
    }
};
