import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { WasmApiWalletAccount, WasmPsbt, WasmTxBuilder } from '@proton/andromeda';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import { CryptoProxy, PublicKeyReference } from '@proton/crypto/lib';
import useLoading from '@proton/hooks/useLoading';
import { SECOND } from '@proton/shared/lib/constants';
import { IWasmApiWalletData, encryptWalletDataWithWalletKey } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../contexts';
import { getAccountWithChainDataFromManyWallets, isUndefined } from '../utils';
import { useBlockchainClient } from './useBlockchainClient';

interface BroadcastData
    extends Required<
        Pick<{ apiWalletData?: IWasmApiWalletData; apiAccount?: WasmApiWalletAccount }, 'apiAccount' | 'apiWalletData'>
    > {
    noteToSelf: string;
    message: string;
    exchangeRateId: string;
    encryptionKeys: PublicKeyReference[];
}

export const usePsbt = ({ txBuilder }: { txBuilder: WasmTxBuilder }) => {
    const blockchainClient = useBlockchainClient();

    const { syncSingleWalletAccount, walletsChainData, network } = useBitcoinBlockchainContext();
    const { createNotification } = useNotifications();
    const [loadingBroadcast, withLoadingBroadcast] = useLoading();
    const [psbt, setPsbt] = useState<WasmPsbt>();
    const [broadcastedTxId, setBroadcastedTxId] = useState<string>();

    const [userKeys] = useUserKeys();

    const createPsbt = useCallback(
        async (silent = false) => {
            if (network) {
                try {
                    const psbt = await txBuilder.createPsbt(network);
                    setPsbt(psbt);
                } catch (err) {
                    if (!silent) {
                        createNotification({ text: c('Wallet send').t`Could not create PSBT`, type: 'error' });
                    }
                }
            }
        },
        [txBuilder, network, createNotification]
    );

    const signAndBroadcastPsbt = ({
        apiWalletData: wallet,
        apiAccount: account,
        exchangeRateId,
        noteToSelf,
        message,
        encryptionKeys,
    }: BroadcastData) => {
        return withLoadingBroadcast(async () => {
            const wasmAccount = getAccountWithChainDataFromManyWallets(
                walletsChainData,
                wallet?.Wallet.ID,
                account?.ID
            );

            if (!psbt || !userKeys || !wasmAccount || isUndefined(network) || !wallet.WalletKey?.DecryptedKey) {
                return;
            }

            const signed = await psbt.sign(wasmAccount.account, network).catch(() => {
                throw new Error(c('Wallet Send').t`Could not sign transaction`);
            });

            const signingKeys = userKeys.map((k) => k.privateKey);
            const { message: encryptedData } = await CryptoProxy.encryptMessage({
                textData: message,
                encryptionKeys,
                signingKeys,
                format: 'armored',
            }).catch(() => ({ message: null }));

            const [encryptedNoteToSelf] = await encryptWalletDataWithWalletKey(
                [noteToSelf],
                wallet.WalletKey.DecryptedKey
            ).catch(() => [null]);

            const txId = await blockchainClient
                .broadcastPsbt(
                    signed,
                    wallet.Wallet.ID,
                    account.ID,
                    {
                        label: encryptedNoteToSelf,
                        exchange_rate_or_transaction_time: {
                            key: 'ExchangeRate',
                            value: exchangeRateId,
                        },
                    },
                    { address_id: account.Addresses[0]?.ID ?? null, subject: null, body: encryptedData }
                )
                .catch(() => {
                    throw new Error(c('Wallet Send').t`Could not broadcast transaction`);
                });

            setBroadcastedTxId(txId);

            setTimeout(() => {
                void syncSingleWalletAccount(wallet.Wallet.ID, account.ID);
            }, 1 * SECOND);
        });
    };

    const erasePsbt = useCallback(() => {
        setPsbt(undefined);
    }, []);

    return { psbt, loadingBroadcast, broadcastedTxId, createPsbt, erasePsbt, signAndBroadcastPsbt };
};
