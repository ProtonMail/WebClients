import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { WasmBlockchainClient, WasmPartiallySignedTransaction, WasmTxBuilder } from '@proton/andromeda';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { SECOND } from '@proton/shared/lib/constants';

import { WalletAndAccountSelectorValue } from '../atoms';
import { useBitcoinBlockchainContext } from '../contexts';
import { getAccountWithChainDataFromManyWallets, tryHandleWasmError } from '../utils';

export const usePsbt = ({
    walletAndAccount,
    txBuilder,
}: {
    walletAndAccount: WalletAndAccountSelectorValue;
    txBuilder: WasmTxBuilder;
}) => {
    const { syncSingleWalletAccount, walletsChainData, network } = useBitcoinBlockchainContext();
    const { createNotification } = useNotifications();
    const [loadingBroadcast, withLoadingBroadcast] = useLoading();
    const [finalPsbt, setFinalPsbt] = useState<WasmPartiallySignedTransaction>();
    const [broadcastedTxId, setBroadcastedTxId] = useState<string>();

    const createPsbt = useCallback(async () => {
        const { apiAccount: account } = walletAndAccount;
        if (account && network) {
            try {
                const psbt = await txBuilder.createPsbt(network);
                setFinalPsbt(psbt);
            } catch (err) {
                const msg = tryHandleWasmError(err);
                if (msg) {
                    createNotification({ text: msg, type: 'error' });
                }
            }
        }
    }, [walletAndAccount, txBuilder, network, createNotification]);

    const signAndBroadcastPsbt = () => {
        void withLoadingBroadcast(async () => {
            const { apiWalletData: wallet, apiAccount: account } = walletAndAccount;
            const andromedaAccount = getAccountWithChainDataFromManyWallets(
                walletsChainData,
                wallet?.Wallet.ID,
                account?.ID
            );

            if (!finalPsbt || !wallet || !account || !andromedaAccount || !network) {
                return;
            }

            const signed = await finalPsbt.sign(andromedaAccount.account, network);

            try {
                const txId = await new WasmBlockchainClient().broadcastPsbt(signed);
                setBroadcastedTxId(txId);

                setTimeout(() => {
                    void syncSingleWalletAccount(wallet.Wallet.ID, account.ID);
                }, 1 * SECOND);
            } catch (err) {
                const msg = tryHandleWasmError(err);
                createNotification({ text: msg ?? c('Wallet Send').t`Could not broadcast transaction`, type: 'error' });
            }
        });
    };

    const erasePsbt = useCallback(() => {
        setFinalPsbt(undefined);
    }, []);

    return { finalPsbt, loadingBroadcast, broadcastedTxId, createPsbt, erasePsbt, signAndBroadcastPsbt };
};
