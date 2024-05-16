import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { IWasmApiWalletData, useWalletApiClients, walletDeletion } from '@proton/wallet';

import { useWalletDispatch } from '../../store/hooks';

export const useWalletDeletion = (wallet: IWasmApiWalletData) => {
    const [loadingDeletion, withLoadingDeletion] = useLoading();
    const api = useWalletApiClients();
    const { createNotification } = useNotifications();
    const dispatch = useWalletDispatch();

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

    return {
        loadingDeletion,
        handleWalletDeletion,
    };
};
