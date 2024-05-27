import { c } from 'ttag';

import { WasmMnemonic } from '@proton/andromeda';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { IWasmApiWalletData, useWalletApiClients, walletDeletion } from '@proton/wallet';

import { useWalletSetupModalContext } from '../../contexts/WalletSetupModalContext';
import { WalletSetupScheme } from '../../hooks/useWalletSetup/type';
import { useWalletDispatch } from '../../store/hooks';

export const useWalletDeletion = ({ wallet, onDeletion }: { wallet: IWasmApiWalletData; onDeletion: () => void }) => {
    const [loadingDeletion, withLoadingDeletion] = useLoading();
    const api = useWalletApiClients();
    const { createNotification } = useNotifications();
    const dispatch = useWalletDispatch();

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
            } catch (e) {
                createNotification({ type: 'error', text: c('Wallet Settings').t`Wallet could not be deleted` });
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
