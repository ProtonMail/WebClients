import { useCallback } from 'react';

import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import type { IWasmApiWalletData } from '@proton/wallet';
import { encryptWalletDataWithWalletKey, useWalletApi } from '@proton/wallet';
import { updateWalletTransaction, useApiWalletTransactionData, useWalletDispatch } from '@proton/wallet/store';

import { TEXT_AREA_MAX_LENGTH } from '../../constants';
import { TextAreaModal } from '../TextAreaModal';

interface Props extends ModalOwnProps {
    hashedTxId: string;
    apiWalletData: IWasmApiWalletData;
}

export const TransactionNoteModal = ({ apiWalletData, hashedTxId, ...modalProps }: Props) => {
    const [walletTransactions] = useApiWalletTransactionData([hashedTxId]);
    const apiWalletTransaction = walletTransactions?.[hashedTxId];
    const [loading, withLoading] = useLoading();

    const baseLabel = apiWalletTransaction?.Label ?? '';
    const dispatch = useWalletDispatch();

    const [userKeys] = useUserKeys();
    const { createNotification } = useNotifications();
    const walletApi = useWalletApi();

    const handleSaveNote = useCallback(
        async (label: string) => {
            if (!apiWalletTransaction || !userKeys) {
                return;
            }

            const { WalletID, WalletAccountID, ID: TransactionID, Label } = apiWalletTransaction;

            // TODO: later WalletAccountID won't be nullable anymore, typeguard can be removed then
            if (WalletAccountID && apiWalletData?.WalletKey?.DecryptedKey && Label !== label) {
                try {
                    const [encryptedLabel] = await encryptWalletDataWithWalletKey(
                        [label],
                        apiWalletData.WalletKey.DecryptedKey
                    );

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

                    modalProps.onClose?.();
                    createNotification({ text: c('Wallet Transaction').t`Transaction label successfully updated` });
                } catch (error: any) {
                    createNotification({
                        type: 'error',
                        text: error?.error ?? c('Wallet Transaction').t`Could not update transaction label`,
                    });
                }
            }
        },
        [
            apiWalletData.WalletKey?.DecryptedKey,
            createNotification,
            apiWalletTransaction,
            dispatch,
            userKeys,
            walletApi,
            modalProps,
        ]
    );

    return (
        <TextAreaModal
            title={c('Wallet transaction').t`Transaction note`}
            inputLabel={c('Wallet transaction').t`Note to self`}
            buttonText={c('Wallet transaction').t`Save note`}
            value={baseLabel}
            loading={loading}
            onSubmit={(value) => {
                void withLoading(handleSaveNote(value));
            }}
            {...modalProps}
            maxLength={TEXT_AREA_MAX_LENGTH}
        />
    );
};
