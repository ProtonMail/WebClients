import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { WasmApiWalletTransaction } from '@proton/andromeda';
import { ModalPropsWithData, TextAreaTwo } from '@proton/components/components';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import { IWasmApiWalletData, encryptWalletDataWithWalletKey, useWalletApi } from '@proton/wallet';

import { Button, Input, Modal } from '../../atoms';
import { useBitcoinBlockchainContext } from '../../contexts';
import { TransactionData } from '../../hooks/useWalletTransactions';

interface Props extends ModalPropsWithData<{ transaction: TransactionData }> {
    apiWalletData: IWasmApiWalletData;
    onUpdate: (updatedTx: WasmApiWalletTransaction, oldTransactionData: TransactionData) => void;
}

export const TransactionNoteModal = ({ onUpdate, apiWalletData, data, ...modalProps }: Props) => {
    const baseLabel = data?.transaction.apiData?.Label ?? '';
    const [label, setLabel] = useState('');
    const [userKeys] = useUserKeys();
    const { createNotification } = useNotifications();
    const { walletMap } = useBitcoinBlockchainContext();
    const walletApi = useWalletApi();

    useEffect(() => {
        setLabel(baseLabel);
    }, [baseLabel]);

    const handleSaveNote = useCallback(async () => {
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
    }, [
        createNotification,
        data?.transaction,
        label,
        onUpdate,
        userKeys,
        apiWalletData.WalletKey?.DecryptedKey,
        walletApi,
        walletMap,
    ]);

    return (
        <Modal title={c('Wallet transaction').t`Transaction note`} {...modalProps}>
            <Input as={TextAreaTwo} rows={3} label="Note to self" value={label} onValue={(v: string) => setLabel(v)} />

            <Button
                color="norm"
                shape="solid"
                className="mt-6"
                fullWidth
                disabled={label === baseLabel || !data?.transaction?.apiData}
                onClick={() => handleSaveNote()}
            >
                {c('Wallet transaction').t`Save note`}
            </Button>
        </Modal>
    );
};
