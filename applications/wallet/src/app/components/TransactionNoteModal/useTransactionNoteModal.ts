import { useCallback } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { encryptWalletDataWithWalletKey, useWalletApi } from '@proton/wallet';
import { updateWalletTransaction, useApiWalletTransactionData, useWalletDispatch } from '@proton/wallet/store';

export const useTransactionNoteModal = ({
    hashedTxId,
    onClose,
    walletKey,
}: {
    hashedTxId: string;
    onClose?: () => void;
    walletKey?: CryptoKey;
}) => {
    const [walletTransactions] = useApiWalletTransactionData([hashedTxId]);
    const apiWalletTransaction = walletTransactions?.[hashedTxId];

    const baseLabel = apiWalletTransaction?.Label ?? '';
    const dispatch = useWalletDispatch();

    const { createNotification } = useNotifications();
    const walletApi = useWalletApi();

    const handleSaveNote = useCallback(
        async (label: string) => {
            if (!apiWalletTransaction) {
                return;
            }

            const { WalletID, WalletAccountID, ID: TransactionID, Label } = apiWalletTransaction;

            // TODO: later WalletAccountID won't be nullable anymore, typeguard can be removed then
            if (WalletAccountID && walletKey && Label !== label) {
                try {
                    const [encryptedLabel] = await encryptWalletDataWithWalletKey([label], walletKey);

                    await walletApi
                        .clients()
                        .wallet.updateWalletTransactionLabel(
                            WalletID,
                            WalletAccountID,
                            TransactionID,
                            encryptedLabel ?? ''
                        );

                    if (apiWalletTransaction?.HashedTransactionID) {
                        dispatch(
                            updateWalletTransaction({
                                hashedTransactionId: apiWalletTransaction?.HashedTransactionID,
                                update: { Label: label },
                            })
                        );
                    }

                    onClose?.();
                    createNotification({ text: c('Wallet Transaction').t`Transaction label successfully updated` });
                } catch (error: any) {
                    createNotification({
                        type: 'error',
                        text: error?.error ?? c('Wallet Transaction').t`Could not update transaction label`,
                    });
                }
            }
        },
        [walletKey, createNotification, apiWalletTransaction, dispatch, walletApi, onClose]
    );

    return {
        baseLabel,
        handleSaveNote,
    };
};
