import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmApiWalletTransaction, WasmProtonWalletApiClient, WasmTransactionDetails } from '@proton/andromeda';
import { useNotifications } from '@proton/components/hooks';
import { CryptoProxy } from '@proton/crypto/lib';
import useLoading from '@proton/hooks/useLoading';
import { uint8ArrayToBase64String, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';
import { IWasmApiWalletData, useWalletApi } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../contexts';
import { useGetApiWalletTransactionData } from '../store/hooks';
import { AccountIdByDerivationPathAndWalletId } from '../types';
import {
    decryptPgp,
    decryptWalletData,
    decryptWalletKeyForHmac,
    encryptWalletDataWithWalletKey,
    getSymmetricKey,
    hmac,
} from '../utils/crypto';

type TransactionDataTuple = [WasmTransactionDetails, WasmApiWalletTransaction | null];
type TransactionDataByHashedTxId = Partial<Record<string, TransactionDataTuple>>;

export interface TransactionData {
    networkData: WasmTransactionDetails;
    apiData: WasmApiWalletTransaction | null;
}

const getWalletTransactionsToHash = async (api: WasmProtonWalletApiClient, walletId: string) => {
    try {
        const walletTransactionsToHash = await api.wallet().getWalletTransactionsToHash(walletId);
        return walletTransactionsToHash[0];
    } catch {
        return [];
    }
};

const filterTxWithMissingApiData = (transactionDataByHashedTxId: TransactionDataByHashedTxId) => {
    return (
        Object.entries(transactionDataByHashedTxId)
            // typeguard: since record is partial, we first need to filter out keys with no value
            .filter((entry): entry is [string, TransactionDataTuple] => isTruthy(entry[1]))
            // we only keep transactions that have no api data
            .filter(([, [, apiData]]) => !apiData)
    );
};

const keyTxNetworkDataByHashedTxId = async (transactions: WasmTransactionDetails[], hmacKey: CryptoKey) => {
    return transactions.reduce(
        (prevPromise: Promise<TransactionDataByHashedTxId>, transaction) => {
            return prevPromise.then(async (acc) => {
                try {
                    const hashedTxIdBuffer = await hmac(hmacKey, transaction.txid);

                    const key = uint8ArrayToBase64String(new Uint8Array(hashedTxIdBuffer));
                    const value: TransactionDataTuple = [transaction, null];

                    return {
                        ...acc,
                        [key]: value,
                    };
                } catch {
                    return acc;
                }
            });
        },
        Promise.resolve({} as TransactionDataByHashedTxId)
    );
};

const addMissingHashToWalletTransactions = async (
    api: WasmProtonWalletApiClient,
    walletId: string,
    transactionDataByHashedTxId: TransactionDataByHashedTxId,
    keys: DecryptedKey[],
    hmacKey: CryptoKey
) => {
    const cloned: TransactionDataByHashedTxId = { ...transactionDataByHashedTxId };

    // TODO: check pagination
    const walletTransactionsToHash = await getWalletTransactionsToHash(api, walletId);

    for (const walletTransactionToHash of walletTransactionsToHash) {
        try {
            // Decrypt txid
            const decryptedTxId = await decryptPgp(walletTransactionToHash.Data.TransactionID, keys);

            // Then hash it
            const hashedTxIdBuffer = await hmac(hmacKey, uint8ArrayToString(decryptedTxId));
            const hashedTransactionID = uint8ArrayToBase64String(new Uint8Array(hashedTxIdBuffer));

            if (!walletTransactionToHash.Data.WalletAccountID) {
                continue;
            }

            // TODO: maybe spawn an error message here?
            await api
                .wallet()
                .updateWalletTransactionHashedTxId(
                    walletId,
                    walletTransactionToHash.Data.WalletAccountID,
                    walletTransactionToHash.Data.ID,
                    hashedTransactionID
                )
                .catch(noop);

            const networkTx = cloned[hashedTransactionID]?.[0];

            // If transaction was not in the record, we don't include it
            if (networkTx) {
                cloned[hashedTransactionID] = [
                    networkTx,
                    { ...walletTransactionToHash.Data, HashedTransactionID: hashedTransactionID },
                ];
            }
        } catch {}
    }

    return cloned;
};

const createMissingTxData = async (
    api: WasmProtonWalletApiClient,
    userKey: DecryptedKey,
    walletId: string,
    accountIdByDerivationPathAndWalletId: AccountIdByDerivationPathAndWalletId,
    transactionsMissingApiData: [string, TransactionDataTuple][]
) => {
    const createdTransactionDataByHashedTxId: TransactionDataByHashedTxId = {};

    for (const [hashedTxId, txData] of transactionsMissingApiData) {
        try {
            const [networkData] = txData;

            const accountId = accountIdByDerivationPathAndWalletId[walletId]?.[networkData.account_derivation_path];

            if (!accountId) {
                continue;
            }

            const { message: txid } = await CryptoProxy.encryptMessage({
                textData: networkData.txid,
                encryptionKeys: [userKey.privateKey],
                signingKeys: [userKey.privateKey],
                format: 'armored',
            });

            const { Data: createdTx } = await api.wallet().createWalletTransaction(walletId, accountId, {
                txid,
                hashed_txid: hashedTxId,
                transaction_time: networkData.time?.confirmation_time
                    ? networkData.time?.confirmation_time.toString()
                    : null,
                label: null,
                exchange_rate_id: null,
            });

            createdTransactionDataByHashedTxId[hashedTxId] = [networkData, createdTx];
        } catch {}
    }

    return createdTransactionDataByHashedTxId;
};

export const useWalletTransactions = ({
    transactions,
    keys,
    wallet,
}: {
    transactions: WasmTransactionDetails[];
    keys?: DecryptedKey[];
    wallet?: IWasmApiWalletData;
}) => {
    const rustApi = useWalletApi();

    const getTransactionsApiData = useGetApiWalletTransactionData();

    const [transactionDataByHashedTxId, setTransactionDataByHashedTxId] = useState<TransactionDataByHashedTxId>({});
    const { accountIDByDerivationPathByWalletID } = useBitcoinBlockchainContext();
    const { createNotification } = useNotifications();

    const [loadingRecordInit, withLoadingRecordInit] = useLoading();
    const [loadingApiData, withLoadingApiData] = useLoading();

    const fetchWalletTransactions = useCallback(async () => {
        if (!wallet || !keys || !transactions.length) {
            return;
        }

        const {
            WalletKey,
            Wallet: { ID: walletId },
        } = wallet;

        if (!WalletKey) {
            return;
        }

        const initResult = (await withLoadingRecordInit(async () => {
            const hmacKey = await decryptWalletKeyForHmac(WalletKey.WalletKey, keys);
            const localTransactionDataByHashedTxId = await keyTxNetworkDataByHashedTxId(transactions, hmacKey);

            setTransactionDataByHashedTxId(localTransactionDataByHashedTxId);

            // Return a clone of set reference, so that we can later mutate it and set it again
            return [hmacKey, { ...localTransactionDataByHashedTxId }] as const;
        })) as [CryptoKey, Partial<Record<string, TransactionDataTuple>>];

        const [hmacKey, localTransactionDataByHashedTxId] = initResult;

        const hashedTxids = Object.keys(localTransactionDataByHashedTxId);

        const transactionsApiData = await getTransactionsApiData(walletId, undefined, hashedTxids);

        // populate txData with api data
        for (const { Data: transactionApiData } of transactionsApiData) {
            const { HashedTransactionID } = transactionApiData;
            if (HashedTransactionID) {
                const txNetworkData = localTransactionDataByHashedTxId[HashedTransactionID]?.[0];

                if (txNetworkData) {
                    const [decryptedLabel] = await decryptWalletData(
                        [transactionApiData.Label],
                        WalletKey.WalletKey,
                        keys
                    ).catch(() => []);

                    localTransactionDataByHashedTxId[HashedTransactionID] = [
                        txNetworkData,
                        { ...transactionApiData, Label: decryptedLabel ?? '' },
                    ];
                }
            }
        }

        // If we already fetched all api data for the page, we don't need to go further
        if (transactionsApiData.length === hashedTxids.length) {
            return setTransactionDataByHashedTxId(localTransactionDataByHashedTxId);
        }

        // Check if there are wallet transaction already created but not hashed yet
        const withMissingHashTransactions = await addMissingHashToWalletTransactions(
            rustApi,
            walletId,
            localTransactionDataByHashedTxId,
            keys,
            hmacKey
        );

        const transactionsMissingApiData = filterTxWithMissingApiData(withMissingHashTransactions);

        // If we already found all transactions's api data, we can just set them
        if (!transactionsMissingApiData.length) {
            setTransactionDataByHashedTxId(withMissingHashTransactions);
        } else {
            const [primaryUserKey] = keys;

            // Else we create missing tx in api
            const created = await createMissingTxData(
                rustApi,
                primaryUserKey,
                walletId,
                accountIDByDerivationPathByWalletID,
                transactionsMissingApiData
            );

            setTransactionDataByHashedTxId((prev) => ({ ...prev, ...withMissingHashTransactions, ...created }));
        }
    }, [
        wallet,
        keys,
        transactions,
        withLoadingRecordInit,
        getTransactionsApiData,
        rustApi,
        accountIDByDerivationPathByWalletID,
    ]);

    const updateWalletTransaction = useCallback(
        async (labelInput: string, txData: TransactionData) => {
            const { networkData, apiData } = txData;

            if (!apiData) {
                return;
            }

            const { WalletID, WalletAccountID, ID: TransactionID, Label } = apiData;

            if (keys && WalletAccountID && wallet?.WalletKey?.WalletKey && Label !== labelInput) {
                try {
                    const decryptedKey = await decryptPgp(wallet.WalletKey.WalletKey, keys);
                    const key = await getSymmetricKey(decryptedKey);
                    const [encryptedLabel] = await encryptWalletDataWithWalletKey([labelInput], key);

                    const { Data: updatedTx } = await rustApi
                        .wallet()
                        .updateWalletTransactionLabel(WalletID, WalletAccountID, TransactionID, encryptedLabel ?? '');

                    const hashedTxId = updatedTx.HashedTransactionID;
                    if (hashedTxId) {
                        setTransactionDataByHashedTxId((prev) => ({
                            ...prev,
                            [hashedTxId]: [networkData, { ...updatedTx, Label: labelInput }],
                        }));
                    }

                    createNotification({ text: c('Wallet Transaction').t`Transaction label successfully updated` });
                } catch (e) {
                    createNotification({
                        type: 'error',
                        text: c('Wallet Transaction').t`Could not update transaction label`,
                    });
                }
            }
        },
        [keys, wallet?.WalletKey?.WalletKey, rustApi, createNotification]
    );

    useEffect(() => {
        const bootstrap = async () => {
            await withLoadingApiData(fetchWalletTransactions());
        };

        void bootstrap();
    }, [withLoadingApiData, fetchWalletTransactions]);

    const transactionDetails: TransactionData[] = useMemo(() => {
        return Object.entries(transactionDataByHashedTxId) // typeguard: since record is partial, we first need to filter out keys with no value
            .filter((entry): entry is [string, TransactionDataTuple] => isTruthy(entry[1]))
            .map(([, [networkData, apiData]]) => ({ networkData, apiData }));
    }, [transactionDataByHashedTxId]);

    return {
        loadingRecordInit,
        loadingApiData,
        transactionDetails,

        updateWalletTransaction,
    };
};
