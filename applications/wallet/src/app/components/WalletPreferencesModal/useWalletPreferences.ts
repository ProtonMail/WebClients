import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { WasmMnemonic } from '@proton/andromeda';
import { useModalState } from '@proton/components/components';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import {
    IWasmApiWalletData,
    encryptWalletDataWithWalletKey,
    useWalletApiClients,
    walletNameUpdate,
} from '@proton/wallet';

import { useWalletSetupModalContext } from '../../contexts/WalletSetupModalContext';
import { WalletSetupScheme } from '../../hooks/useWalletSetup/type';
import { useWalletDispatch } from '../../store/hooks';

export const useWalletPreferences = (wallet: IWasmApiWalletData) => {
    const [walletName, setWalletName] = useState(wallet.Wallet.Name);

    const [walletDeletionConfirmationModal, setWalletDeletionConfirmationModal] = useModalState();

    const [loadingWalletNameUpdate, withLoadingWalletNameUpdate] = useLoading();

    const api = useWalletApiClients();
    const { createNotification } = useNotifications();
    const dispatch = useWalletDispatch();
    const [userKeys] = useUserKeys();

    const { open } = useWalletSetupModalContext();
    const openBackupModal = () => {
        if (wallet.Wallet.Mnemonic) {
            open({
                schemeAndData: {
                    scheme: WalletSetupScheme.WalletBackup,
                    mnemonic: WasmMnemonic.fromString(wallet.Wallet.Mnemonic),
                },
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
            } catch (e) {
                createNotification({ type: 'error', text: c('Wallet Settings').t`Wallet name could not be change` });
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

    const openWalletDeletionConfirmationModal = () => {
        setWalletDeletionConfirmationModal(true);
    };

    return {
        walletName,
        loadingWalletNameUpdate,
        setWalletName,
        updateWalletName,

        openBackupModal,

        walletDeletionConfirmationModal,
        openWalletDeletionConfirmationModal,
    };
};
