import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { useModalState } from '@proton/components/components';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import {
    IWasmApiWalletData,
    decryptWalletKey,
    encryptWalletDataWithWalletKey,
    useWalletApiClients,
    walletDeletion,
    walletNameUpdate,
} from '@proton/wallet';

import { useWalletSetupModalContext } from '../../contexts/WalletSetupModalContext';
import { useWalletDispatch } from '../../store/hooks';

export const useWalletPreferences = (wallet: IWasmApiWalletData) => {
    const [walletName, setWalletName] = useState(wallet.Wallet.Name);

    const { open: openBackupModal } = useWalletSetupModalContext();

    const [walletDeletionConfirmationModal, setWalletDeletionConfirmationModal] = useModalState();

    const [loadingWalletNameUpdate, withLoadingWalletNameUpdate] = useLoading();

    const [loadingDeletion, withLoadingDeletion] = useLoading();
    const api = useWalletApiClients();
    const { createNotification } = useNotifications();
    const dispatch = useWalletDispatch();
    const [userKeys] = useUserKeys();

    const handleWalletDeletion = () => {
        const promise = async () => {
            try {
                await api.wallet.deleteWallet(wallet.Wallet.ID);

                createNotification({ text: c('Wallet Settings').t`Wallet was deleted` });
                dispatch(
                    walletDeletion({
                        walletID: wallet.Wallet.ID,
                    })
                );
            } catch (e) {
                createNotification({ type: 'error', text: c('Wallet Settings').t`Wallet could not be deleted` });
            }
        };

        void withLoadingDeletion(promise());
    };

    const updateWalletName = useCallback(() => {
        const promise = async () => {
            if (!userKeys || !wallet.WalletKey?.WalletKey || walletName === wallet.Wallet.Name) {
                return;
            }

            const decryptedKey = await decryptWalletKey(wallet.WalletKey?.WalletKey, userKeys);
            const [encryptedWalletName] = await encryptWalletDataWithWalletKey([walletName], decryptedKey);

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
        wallet.WalletKey?.WalletKey,
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

        walletDeletionConfirmationModal,
        openWalletDeletionConfirmationModal,
        loadingDeletion,
        handleWalletDeletion,

        openBackupModal,
    };
};
