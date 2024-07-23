import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import type { WasmBitcoinUnit } from '@proton/andromeda';
import { useModalState } from '@proton/components/components';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import type { IWasmApiWalletData } from '@proton/wallet';
import {
    bitcoinUnitChange,
    encryptWalletDataWithWalletKey,
    useUserWalletSettings,
    useWalletApiClients,
    walletNameUpdate,
} from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../../contexts';
import { WalletSetupModalKind, useWalletSetupModalContext } from '../../contexts/WalletSetupModalContext';
import { useWalletDispatch } from '../../store/hooks';
import { getThemeForWallet } from '../../utils';

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

    const { decryptedApiWalletsData = [] } = useBitcoinBlockchainContext();

    const { open } = useWalletSetupModalContext();
    const openBackupModal = () => {
        if (wallet.Wallet.Mnemonic) {
            open({
                theme: getThemeForWallet(decryptedApiWalletsData, wallet.Wallet.ID),
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

            const [encryptedWalletName] = await encryptWalletDataWithWalletKey(
                [walletName],
                wallet.WalletKey.DecryptedKey
            );

            try {
                await api.wallet.updateWalletName(wallet.Wallet.ID, encryptedWalletName);

                createNotification({ text: c('Wallet Settings').t`Wallet name changed` });
                dispatch(
                    walletNameUpdate({
                        walletID: wallet.Wallet.ID,
                        name: walletName,
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
        createNotification({ text: c('Wallet Settings').t`Local storage cleared` });
    };

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

        openBackupModal,

        walletDeletionConfirmationModal,
        openWalletDeletionConfirmationModal,

        clearBrowserStorage,
    };
};
