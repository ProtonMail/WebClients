import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import type { WasmApiWalletAccount, WasmPsbt } from '@proton/andromeda';
import { useUserKeys } from '@proton/components/hooks';
import type { PublicKeyReference } from '@proton/crypto/lib';
import useLoading from '@proton/hooks/useLoading';
import { SECOND } from '@proton/shared/lib/constants';
import type { DecryptedAddressKey, SimpleMap } from '@proton/shared/lib/interfaces';
import type { IWasmApiWalletData } from '@proton/wallet';
import { encryptPgp, encryptWalletDataWithWalletKey } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../contexts';
import { getAccountWithChainDataFromManyWallets, isUndefined } from '../utils';
import { useBlockchainClient } from './useBlockchainClient';
import { type TxBuilderHelper } from './useTxBuilder';

interface BroadcastData
    extends Required<
        Pick<{ apiWalletData?: IWasmApiWalletData; apiAccount?: WasmApiWalletAccount }, 'apiAccount' | 'apiWalletData'>
    > {
    noteToSelf?: string;
    exchangeRateId?: string;
    // BvE data
    message?: {
        content: string;
        encryptionKeys: PublicKeyReference[];
    };
    senderAddress?: {
        ID: string;
        key: DecryptedAddressKey;
    };
    recipients?: SimpleMap<string>;
    isAnonymousSend?: boolean;
}

const getNowTimestamp = (): string => {
    return Math.floor(Date.now() / SECOND).toString();
};

export const usePsbt = ({ txBuilderHelpers }: { txBuilderHelpers: TxBuilderHelper }, shouldCreatePsbt = false) => {
    const blockchainClient = useBlockchainClient();

    const { incrementSyncKey, walletsChainData, network } = useBitcoinBlockchainContext();
    const [loadingBroadcast, withLoadingBroadcast] = useLoading();
    const [psbt, setPsbt] = useState<WasmPsbt>();
    const [broadcastedTxId, setBroadcastedTxId] = useState<string>();

    const [userKeys] = useUserKeys();

    const { txBuilder } = txBuilderHelpers;

    const createDraftPsbt = useCallback(async (): Promise<WasmPsbt | null> => {
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
    }, [network, txBuilder]);

    useEffect(() => {
        const run = async () => {
            const psbt = await createDraftPsbt().catch(() => null);

            if (psbt) {
                setPsbt(psbt);
            }
        };

        if (shouldCreatePsbt) {
            void run();
        }
    }, [createDraftPsbt, shouldCreatePsbt]);

    const signAndBroadcastPsbt = ({
        apiWalletData,
        apiAccount,
        exchangeRateId,
        noteToSelf,
        senderAddress,
        message,
        recipients,
        isAnonymousSend,
    }: BroadcastData) => {
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

            const signed = await psbt.sign(wasmAccount.account, network).catch(() => {
                throw new Error(c('Wallet Send').t`Could not sign transaction`);
            });

            const [encryptedNoteToSelf] = noteToSelf
                ? await encryptWalletDataWithWalletKey([noteToSelf], apiWalletData.WalletKey.DecryptedKey).catch(() => [
                      null,
                  ])
                : [null];

            const getEncryptedBody = async (senderAddressKey: DecryptedAddressKey) => ({
                body: message?.content
                    ? await encryptPgp(
                          message.content,
                          [senderAddressKey.publicKey, ...message.encryptionKeys],
                          [senderAddressKey.privateKey]
                      ).catch(() => null)
                    : null,
            });

            const transactionData = {
                label: encryptedNoteToSelf,
                exchange_rate_or_transaction_time: exchangeRateId
                    ? {
                          key: 'ExchangeRate' as const,
                          value: exchangeRateId,
                      }
                    : { key: 'TransactionTime' as const, value: getNowTimestamp() },
            };

            const bveData = senderAddress
                ? {
                      recipients: (recipients as Record<string, string>) || null,
                      is_anonymous: isAnonymousSend ? 1 : 0,
                      address_id: senderAddress.ID,
                      ...(await getEncryptedBody(senderAddress.key)),
                  }
                : undefined;

            try {
                const txId = await blockchainClient.broadcastPsbt(
                    signed,
                    apiWalletData.Wallet.ID,
                    apiAccount.ID,
                    transactionData,
                    bveData
                );

                await wasmAccount.account.insertUnconfirmedTransaction(psbt);
                incrementSyncKey(apiAccount.WalletID, apiAccount.ID);

                setBroadcastedTxId(txId);
            } catch (error: any) {
                throw new Error(error?.error ?? c('Wallet Send').t`Could not broadcast transaction`);
            }
        });
    };

    const erasePsbt = useCallback(() => {
        setPsbt(undefined);
    }, []);

    return { psbt, loadingBroadcast, broadcastedTxId, createDraftPsbt, erasePsbt, signAndBroadcastPsbt };
};
