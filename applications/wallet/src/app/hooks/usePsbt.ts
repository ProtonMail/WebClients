import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { WasmApiWalletAccount, WasmPsbt, WasmTxBuilder } from '@proton/andromeda';
import { useUserKeys } from '@proton/components/hooks';
import { PrivateKeyReference, PublicKeyReference } from '@proton/crypto/lib';
import useLoading from '@proton/hooks/useLoading';
import { IWasmApiWalletData, encryptPgp, encryptWalletDataWithWalletKey } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../contexts';
import { getAccountWithChainDataFromManyWallets, isUndefined } from '../utils';
import { useBlockchainClient } from './useBlockchainClient';

interface BroadcastData
    extends Required<
        Pick<{ apiWalletData?: IWasmApiWalletData; apiAccount?: WasmApiWalletAccount }, 'apiAccount' | 'apiWalletData'>
    > {
    noteToSelf?: string;
    message?: string;
    exchangeRateId?: string;
    signingKeys: PrivateKeyReference[];
    encryptionKeys: PublicKeyReference[];
}

export const usePsbt = ({ txBuilder }: { txBuilder: WasmTxBuilder }, shouldCreatePsbt = false) => {
    const blockchainClient = useBlockchainClient();

    const { incrementSyncKey, walletsChainData, network } = useBitcoinBlockchainContext();
    const [loadingBroadcast, withLoadingBroadcast] = useLoading();
    const [psbt, setPsbt] = useState<WasmPsbt>();
    const [broadcastedTxId, setBroadcastedTxId] = useState<string>();

    const [userKeys] = useUserKeys();

    const createDraftPsbt = useCallback(
        async (inputTxBuilder?: WasmTxBuilder) => {
            if (!isUndefined(network)) {
                try {
                    return await (inputTxBuilder ?? txBuilder).createDraftPsbt(network);
                } catch (err) {
                    console.error('An error occurred when building PSBT', err);
                    throw err;
                }
            } else {
                throw new Error('missing network');
            }
        },
        [network, txBuilder]
    );

    useEffect(() => {
        const run = async () => {
            const psbt = await createDraftPsbt();

            if (psbt) {
                setPsbt(psbt);
            }
        };

        if (shouldCreatePsbt) {
            void run();
        }
    }, [createDraftPsbt, shouldCreatePsbt]);

    const signAndBroadcastPsbt = (
        {
            apiWalletData: wallet,
            apiAccount: account,
            exchangeRateId,
            noteToSelf,
            message,
            signingKeys,
            encryptionKeys,
        }: BroadcastData,
        isUsingBitcoinViaEmail: boolean
    ) => {
        return withLoadingBroadcast(async () => {
            const wasmAccount = getAccountWithChainDataFromManyWallets(
                walletsChainData,
                wallet?.Wallet.ID,
                account?.ID
            );

            if (!userKeys || !wasmAccount || isUndefined(network) || !wallet.WalletKey?.DecryptedKey) {
                return;
            }

            const psbt = await txBuilder.createPsbt(network);

            const signed = await psbt.sign(wasmAccount.account, network).catch(() => {
                throw new Error(c('Wallet Send').t`Could not sign transaction`);
            });

            const encryptedData = message
                ? await encryptPgp(message, encryptionKeys, signingKeys).catch(() => null)
                : null;

            const [encryptedNoteToSelf] = noteToSelf
                ? await encryptWalletDataWithWalletKey([noteToSelf], wallet.WalletKey.DecryptedKey).catch(() => [null])
                : [null];

            const txId = await blockchainClient
                .broadcastPsbt(
                    signed,
                    wallet.Wallet.ID,
                    account.ID,
                    {
                        label: encryptedNoteToSelf,
                        exchange_rate_or_transaction_time: exchangeRateId
                            ? {
                                  key: 'ExchangeRate',
                                  value: exchangeRateId,
                              }
                            : { key: 'TransactionTime', value: Date.now().toString() },
                    },
                    isUsingBitcoinViaEmail
                        ? {
                              address_id: account.Addresses[0]?.ID ?? null,
                              subject: null,
                              body: encryptedData,
                          }
                        : undefined
                )
                .catch(() => {
                    throw new Error(c('Wallet Send').t`Could not broadcast transaction`);
                });

            await wasmAccount.account.insertUnconfirmedTransaction(psbt);
            incrementSyncKey(account.WalletID, account.ID);

            setBroadcastedTxId(txId);
        });
    };

    const erasePsbt = useCallback(() => {
        setPsbt(undefined);
    }, []);

    return { psbt, loadingBroadcast, broadcastedTxId, createDraftPsbt, erasePsbt, signAndBroadcastPsbt };
};
