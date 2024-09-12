import { useCallback } from 'react';

import { c } from 'ttag';

import type { WasmApiWalletTransaction } from '@proton/andromeda';
import type { ModalPropsWithData } from '@proton/components';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import type { IWasmApiWalletData } from '@proton/wallet';
import { encryptWalletDataWithWalletKey, useWalletApi } from '@proton/wallet';

import { TEXT_AREA_MAX_LENGTH } from '../../constants';
import { useBitcoinBlockchainContext } from '../../contexts';
import type { TransactionData } from '../../hooks/useWalletTransactions';
import { TextAreaModal } from '../TextAreaModal';

interface Props extends ModalPropsWithData<{ transaction: TransactionData }> {
    apiWalletData: IWasmApiWalletData;
    onUpdate: (updatedTx: WasmApiWalletTransaction, oldTransactionData: TransactionData) => void;
}

export const TransactionNoteModal = ({ onUpdate, apiWalletData, data, ...modalProps }: Props) => {
    const baseLabel = data?.transaction.apiData?.Label ?? '';

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

                    const { Data: updatedTx } = await walletApi
                        .clients()
                        .wallet.updateWalletTransactionLabel(
                            WalletID,
                            WalletAccountID,
                            TransactionID,
                            encryptedLabel ?? ''
                        );

                    createNotification({ text: c('Wallet Transaction').t`Transaction label successfully updated` });
                    onUpdate(updatedTx, data.transaction);
                } catch (e) {
                    createNotification({
                        type: 'error',
                        text: c('Wallet Transaction').t`Could not update transaction label`,
                    });
                }
            }
        },
        [
            createNotification,
            data?.transaction,
            onUpdate,
            userKeys,
            apiWalletData.WalletKey?.DecryptedKey,
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
