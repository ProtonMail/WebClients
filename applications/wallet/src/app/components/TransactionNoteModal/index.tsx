import { useCallback } from 'react';

import { c } from 'ttag';

import type { ModalPropsWithData } from '@proton/components';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import type { IWasmApiWalletData } from '@proton/wallet';
import { type TransactionData, encryptWalletDataWithWalletKey, useWalletApi } from '@proton/wallet';
import { updateWalletTransaction, useWalletDispatch } from '@proton/wallet/store';

import { TEXT_AREA_MAX_LENGTH } from '../../constants';
import { useBitcoinBlockchainContext } from '../../contexts';
import { TextAreaModal } from '../TextAreaModal';

interface Props extends ModalPropsWithData<{ transaction: TransactionData }> {
    apiWalletData: IWasmApiWalletData;
}

export const TransactionNoteModal = ({ apiWalletData, data, ...modalProps }: Props) => {
    const baseLabel = data?.transaction.apiData?.Label ?? '';
    const dispatch = useWalletDispatch();

    const [userKeys] = useUserKeys();
    const { createNotification } = useNotifications();
    const { walletMap } = useBitcoinBlockchainContext();
    const walletApi = useWalletApi();

    const handleSaveNote = useCallback(
        async (label: string) => {
            const apiData = data?.transaction?.apiData;

            if (!apiData || !userKeys) {
                return;
            }

            const { WalletID, WalletAccountID, ID: TransactionID, Label } = apiData;

            // TODO: later WalletAccountID won't be nullable anymore, typeguard can be removed then
            const account = WalletAccountID && walletMap[WalletID]?.accounts[WalletAccountID];

            if (account && WalletAccountID && apiWalletData?.WalletKey?.DecryptedKey && Label !== label) {
                // TODO: later WalletAccountID won't be nullable anymore, typeguard can be removed then

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

                    if (data.transaction.apiData?.HashedTransactionID) {
                        dispatch(
                            updateWalletTransaction({
                                hashedTransactionId: data.transaction.apiData?.HashedTransactionID,
                                update: { Label: label },
                            })
                        );
                    }

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
            data?.transaction.apiData,
            dispatch,
            userKeys,
            walletApi,
            walletMap,
        ]
    );

    return (
        <TextAreaModal
            title={c('Wallet transaction').t`Transaction note`}
            inputLabel={c('Wallet transaction').t`Note to self`}
            buttonText={c('Wallet transaction').t`Save note`}
            value={baseLabel}
            onSubmit={(value) => handleSaveNote(value)}
            {...modalProps}
            maxLength={TEXT_AREA_MAX_LENGTH}
        />
    );
};
