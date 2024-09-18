import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import type { WasmBitcoinUnit } from '@proton/andromeda';
import { useModalState } from '@proton/components';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import type { IWasmApiWalletData } from '@proton/wallet';
import { encryptWalletDataWithWalletKey, useWalletApiClients } from '@proton/wallet';
import { bitcoinUnitChange, useUserWalletSettings, useWalletDispatch, walletUpdate } from '@proton/wallet/store';

import { useBitcoinBlockchainContext } from '../../contexts';
import { WalletSetupModalKind, useWalletSetupModalContext } from '../../contexts/WalletSetupModalContext';
import { getAccountBalance, getAccountWithChainDataFromManyWallets, getThemeForWallet } from '../../utils';

export const useWalletPreferences = (wallet: IWasmApiWalletData, onEmptyWalletAccount?: () => void) => {
    const [walletName, setWalletName] = useState(wallet.Wallet.Name);
    const [userWalletSettings, loadingGetUserWalletSettings] = useUserWalletSettings();
    const [loadingSetUserWalletSettings, withLoadingSetUserWalletSettings] = useLoading();
    const loadingUserWalletSettings = loadingGetUserWalletSettings || loadingSetUserWalletSettings;

    const [walletDeletionConfirmationModal, setWalletDeletionConfirmationModal] = useModalState();

    const [loadingWalletNameUpdate, withLoadingWalletNameUpdate] = useLoading();

    const api = useWalletApiClients();
    const { createNotification } = useNotifications();
    const dispatch = useWalletDispatch();
    const [userKeys] = useUserKeys();

    const { apiWalletsData = [], walletsChainData } = useBitcoinBlockchainContext();

    const { open } = useWalletSetupModalContext();
    const openBackupModal = () => {
        if (wallet.Wallet.Mnemonic) {
            open({
                theme: getThemeForWallet(apiWalletsData, wallet.Wallet.ID),
                apiWalletData: wallet,
                kind: WalletSetupModalKind.WalletBackup,
            });
        }
    };

    const updateWalletName = useCallback(() => {
        const promise = async () => {
            if (!userKeys || !wallet.WalletKey?.DecryptedKey || walletName === wallet.Wallet.Name) {
                return;
            }

            const [encryptedWalletAccountLabel] = await encryptWalletDataWithWalletKey(
                [walletName],
                wallet.WalletKey.DecryptedKey
            );

            try {
                await api.wallet.updateWalletName(wallet.Wallet.ID, encryptedWalletAccountLabel);
                createNotification({ text: c('Wallet Settings').t`Wallet name changed` });

                dispatch(
                    walletUpdate({
                        walletID: wallet.Wallet.ID,
                        update: { Name: walletName },
                    })
                );
            } catch (error: any) {
                createNotification({
                    type: 'error',
                    text: error?.error ?? c('Wallet Settings').t`Wallet name could not be changed`,
                });
            }
        };

        void withLoadingWalletNameUpdate(promise());
    }, [
        withLoadingWalletNameUpdate,
        userKeys,
        walletName,
        wallet.Wallet.Name,
        wallet.Wallet.ID,
        wallet.WalletKey?.DecryptedKey,
        api,
        createNotification,
        dispatch,
    ]);

    const updateBitcoinUnit = useCallback(
        (bitcoinUnit: WasmBitcoinUnit) => {
            const promise = async () => {
                try {
                    await api.settings.setBitcoinUnit(bitcoinUnit);

                    dispatch(
                        bitcoinUnitChange({
                            bitcoinUnit,
                        })
                    );

                    createNotification({
                        text: c('Wallet Settings').t`Preferred bitcoin unit was changed`,
                    });
                } catch (error: any) {
                    createNotification({
                        type: 'error',
                        text: error?.error ?? c('Wallet Settings').t`Preferred bitcoin unit could not be changed`,
                    });
                }
            };

            void withLoadingSetUserWalletSettings(promise());
        },
        [api.settings, createNotification, dispatch, withLoadingSetUserWalletSettings]
    );

    const openWalletDeletionConfirmationModal = () => {
        setWalletDeletionConfirmationModal(true);
    };

    const clearBrowserStorage = () => {
        window.localStorage.clear();
    };

    const [shouldShowBvEWarningByAccountId, setShouldShowBvEWarningByAccountId] = useState<
        Partial<Record<string, boolean>>
    >({});

    useEffect(() => {
        const run = async () => {
            for (const account of wallet.WalletAccounts) {
                const accountChainData = getAccountWithChainDataFromManyWallets(
                    walletsChainData,
                    account.WalletID,
                    account.ID
                );

                const balance = await getAccountBalance(accountChainData);
                setShouldShowBvEWarningByAccountId((prev) => ({
                    ...prev,
                    [account.ID]: account.Priority === 1 || balance > 0,
                }));
            }
        };

        void run();
    }, [wallet.WalletAccounts, walletsChainData]);

    useEffect(() => {
        if (!wallet.WalletAccounts?.length) {
            onEmptyWalletAccount?.();
        }
    }, [onEmptyWalletAccount, wallet.WalletAccounts?.length]);

    return {
        walletName,

        userWalletSettings,
        loadingUserWalletSettings,
        updateBitcoinUnit,

        loadingWalletNameUpdate,
        setWalletName,
        updateWalletName,

        shouldShowBvEWarningByAccountId,

        openBackupModal,

        walletDeletionConfirmationModal,
        openWalletDeletionConfirmationModal,

        clearBrowserStorage,
    };
};
