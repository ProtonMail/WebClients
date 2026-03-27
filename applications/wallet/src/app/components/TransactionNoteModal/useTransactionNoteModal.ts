import { useCallback } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { encryptWalletDataWithWalletKey } from '@proton/wallet';
import { useWalletApi } from '@proton/wallet/contexts';
import { useApiWalletTransactionData, useWalletDispatch } from '@proton/wallet/store/hooks';
import { updateWalletTransaction } from '@proton/wallet/store/slices';

export const useTransactionNoteModal = ({
    transactionDataKey,
    onClose,
    walletKey,
}: {
    transactionDataKey: string;
    onClose?: () => void;
    walletKey?: CryptoKey;
}) => {
    const [walletTransactions] = useApiWalletTransactionData([transactionDataKey]);
    const apiWalletTransaction = walletTransactions?.[transactionDataKey];

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

                    dispatch(
                        updateWalletTransaction({
                            transactionDataKey: transactionDataKey,
                            update: { Label: label },
                        })
                    );

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
