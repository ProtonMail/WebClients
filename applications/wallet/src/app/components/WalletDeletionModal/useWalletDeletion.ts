import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import type { IWasmApiWalletData } from '@proton/wallet';
import { useWalletApiClients } from '@proton/wallet';
import { useWalletDispatch, walletDeletion } from '@proton/wallet/store';

import { useBitcoinBlockchainContext } from '../../contexts';
import { WalletSetupModalKind, useWalletSetupModalContext } from '../../contexts/WalletSetupModalContext';
import { getThemeForWallet } from '../../utils';

export const useWalletDeletion = ({ wallet, onDeletion }: { wallet: IWasmApiWalletData; onDeletion: () => void }) => {
    const [loadingDeletion, withLoadingDeletion] = useLoading();
    const api = useWalletApiClients();
    const { createNotification } = useNotifications();
    const dispatch = useWalletDispatch();
    const { apiWalletsData = [] } = useBitcoinBlockchainContext();

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

                onDeletion();
            } catch (error: any) {
                createNotification({
                    type: 'error',
                    text: error?.error ?? c('Wallet Settings').t`Wallet could not be deleted`,
                });
            }
        };

        void withLoadingDeletion(promise());
    };

    return {
        loadingDeletion,
        openBackupModal,
        handleWalletDeletion,
    };
};
