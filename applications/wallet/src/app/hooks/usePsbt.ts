import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUserKeys } from '@proton/account/userKeys/hooks';
import type { WasmPsbt, WasmTxBuilder } from '@proton/andromeda';
import useLoading from '@proton/hooks/useLoading';

import { useBitcoinBlockchainContext } from '../contexts';
import {
    type BroadcastData,
    getAccountWithChainDataFromManyWallets,
    isUndefined,
    signAndBroadcastPsbt,
} from '../utils';
import { useBlockchainClient } from './useBlockchainClient';
import { type TxBuilderHelper } from './useTxBuilder';

export const usePsbt = ({ txBuilderHelpers }: { txBuilderHelpers: TxBuilderHelper }, shouldCreatePsbt = false) => {
    const blockchainClient = useBlockchainClient();

    const { walletsChainData, network, syncSingleWalletAccount } = useBitcoinBlockchainContext();
    const [loadingBroadcast, withLoadingBroadcast] = useLoading();
    const [psbt, setPsbt] = useState<WasmPsbt>();
    const [broadcastedTxId, setBroadcastedTxId] = useState<string>();

    const [userKeys] = useUserKeys();

    const { txBuilder } = txBuilderHelpers;

    const createDraftPsbt = useCallback(
        async (txBuilder: WasmTxBuilder): Promise<WasmPsbt | null> => {
            if (!isUndefined(network)) {
                try {
                    return await txBuilder.createDraftPsbt(network);
                } catch (err) {
                    console.error('An error occurred when building PSBT', err);
                    throw err;
                }
            } else {
                throw new Error('missing network');
            }
        },
        [network]
    );

    useEffect(() => {
        const run = async () => {
            const psbt = await createDraftPsbt(txBuilder).catch(() => null);

            if (psbt) {
                setPsbt(psbt);
            }
        };

        if (shouldCreatePsbt) {
            void run();
        }
    }, [createDraftPsbt, shouldCreatePsbt, txBuilder]);

    const broadcastPsbt = ({
        apiWalletData,
        apiAccount,
        exchangeRateId,
        noteToSelf,
        senderAddress,
        message,
        recipients,
        isAnonymousSend,
    }: Pick<
        BroadcastData,
        | 'apiWalletData'
        | 'apiAccount'
        | 'exchangeRateId'
        | 'noteToSelf'
        | 'senderAddress'
        | 'message'
        | 'recipients'
        | 'isAnonymousSend'
    >) => {
        return withLoadingBroadcast(async () => {
            const wasmAccount = getAccountWithChainDataFromManyWallets(
                walletsChainData,
                apiWalletData?.Wallet.ID,
                apiAccount?.ID
            );

            if (!userKeys || !wasmAccount || isUndefined(network) || !apiWalletData.WalletKey?.DecryptedKey) {
                return;
            }

            const psbt = await txBuilder.createPsbt(network);

            try {
                await signAndBroadcastPsbt({
                    psbt,
                    blockchainClient,
                    network,
                    userKeys,

                    walletsChainData,
                    apiWalletData,
                    apiAccount,

                    exchangeRateId,
                    noteToSelf,

                    senderAddress,
                    message,
                    recipients,
                    isAnonymousSend,

                    onBroadcastedTx: (txId) => {
                        void syncSingleWalletAccount({
                            walletId: apiAccount.WalletID,
                            accountId: apiAccount.ID,
                            manual: true,
                        });

                        setBroadcastedTxId(txId);
                    },
                });
            } catch (error: any) {
                throw new Error(
                    error?.error ??
                        error?.message ??
                        c('Wallet Send').t`Could not broadcast transaction. Please sync your wallet and try again`
                );
            }
        });
    };

    const erasePsbt = useCallback(() => {
        setPsbt(undefined);
    }, []);

    return { psbt, loadingBroadcast, broadcastedTxId, createDraftPsbt, erasePsbt, signAndBroadcastPsbt: broadcastPsbt };
};
