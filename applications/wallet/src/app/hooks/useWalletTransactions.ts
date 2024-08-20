import type { SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { compact } from 'lodash';
import { c } from 'ttag';

import type { WasmApiClients, WasmApiWalletTransaction, WasmTransactionDetails } from '@proton/andromeda';
import generateUID from '@proton/atoms/generateUID';
import { useAddressesKeys } from '@proton/components/hooks/useAddressesKeys';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { PrivateKeyReference } from '@proton/crypto/lib';
import useLoading from '@proton/hooks/useLoading';
import { SECOND } from '@proton/shared/lib/constants';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';
import type { IWasmApiWalletData } from '@proton/wallet';
import {
    decryptTextData,
    decryptWalletData,
    decryptWalletKeyForHmac,
    encryptPgp,
    hmac,
    useWalletApiClients,
} from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../contexts';
import { useGetApiWalletTransactionData } from '../store/hooks';
import type { AccountIdByDerivationPathAndWalletId } from '../types';
import { removeMasterPrefix } from '../utils';

export type DecryptedTransactionData = Omit<WasmApiWalletTransaction, 'ToList' | 'TransactionID' | 'Sender'> & {
    Sender: SenderObject | string | null;
    ToList: Partial<Record<string, string>>;
    TransactionID: string | null;
};

export interface SenderObject {
    name?: string;
    email?: string;
}

type TransactionDataTuple = [WasmTransactionDetails, DecryptedTransactionData | null];
type TransactionDataByHashedTxId = Partial<Record<string, TransactionDataTuple>>;

export interface TransactionData {
    networkData: WasmTransactionDetails;
    apiData: DecryptedTransactionData | null;
}

const parsedRecipientList = (toList: string | null): Partial<Record<string, string>> => {
    try {
        const parsed = toList ? JSON.parse(toList) : {};

        // TODO: check with API why some toList are arrays
        return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
        return {};
    }
};

/**
 * BitcoinViaEmail API sets Sender as string, but in ExternalSend / ExternalReceive, sender is an object
 */
const parseSender = (sender: string): string | SenderObject => {
    try {
        const parsed: SenderObject = JSON.parse(sender);
        return parsed;
    } catch {
        return sender;
    }
};

/**
 * Decrypt transaction data. If addressKeys is not provided, we won't try to decrypt Body, Sender and ToList.
 *
 * Additionnally, TransactionID decryption might fail if Tx was created by a third party (using address keys)
 */
const decryptTransactionData = async (
    apiTransaction: WasmApiWalletTransaction,
    walletKey: CryptoKey,
    userPrivateKeys?: PrivateKeyReference[],
    addressKeys?: PrivateKeyReference[]
): Promise<DecryptedTransactionData> => {
    const keys = [...(userPrivateKeys ? userPrivateKeys : []), ...(addressKeys ?? [])];

    const [decryptedLabel = ''] = await decryptWalletData([apiTransaction.Label], walletKey).catch(() => []);

    const TransactionID = await decryptTextData(apiTransaction.TransactionID, keys);
    // Sender is encrypted with addressKey in BitcoinViaEmail but with userKey when manually set (unknown sender)
    const Sender = apiTransaction.Sender && (await decryptTextData(apiTransaction.Sender, keys));
    const parsedSender = Sender && parseSender(Sender);

    const apiTransactionB = {
        ...apiTransaction,
        Label: decryptedLabel,
        TransactionID,
        Sender: parsedSender,
        ToList: {},
    };

    if (!addressKeys) {
        return apiTransactionB;
    }

    const Body = apiTransaction.Body && (await decryptTextData(apiTransaction.Body, addressKeys));
    const SerialisedToList = apiTransaction.ToList && (await decryptTextData(apiTransaction.ToList, addressKeys));

    const ToList = parsedRecipientList(SerialisedToList);

    return {
        ...apiTransactionB,
        Body,
        ToList,
    };
};

const getWalletTransactionsToHash = async (api: WasmApiClients, walletId: string) => {
    try {
        const walletTransactionsToHash = await api.wallet.getWalletTransactionsToHash(walletId);
        return walletTransactionsToHash[0];
    } catch {
        return [];
    }
};

const filterTxWithoutApiData = (transactionDataByHashedTxId: TransactionDataByHashedTxId) => {
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

const addMissingHashToWalletTransactions = async ({
    api,
    walletId,
    walletKey,
    transactionDataByHashedTxId,
    userPrivateKeys,
    hmacKey,
    allAddressKeys,
    checkShouldAbort,
}: {
    api: WasmApiClients;
    walletId: string;
    walletKey: CryptoKey;
    transactionDataByHashedTxId: TransactionDataByHashedTxId;
    userPrivateKeys: PrivateKeyReference[];
    hmacKey: CryptoKey;
    allAddressKeys: PrivateKeyReference[];
    checkShouldAbort: () => boolean;
}) => {
    const cloned: TransactionDataByHashedTxId = { ...transactionDataByHashedTxId };

    // TODO: check pagination
    const walletTransactionsToHash = await getWalletTransactionsToHash(api, walletId);

    for (const walletTransactionToHash of walletTransactionsToHash) {
        if (checkShouldAbort()) {
            return cloned;
        }

        try {
            // Decrypt txid
            const decryptedTransactionData = await decryptTransactionData(
                walletTransactionToHash.Data,
                walletKey,
                userPrivateKeys,
                allAddressKeys
            );

            // TODO: this can only occur if decryption fails. We need to better handle that
            if (!decryptedTransactionData.TransactionID || !walletTransactionToHash.Data.WalletAccountID) {
                continue;
            }

            // Then hash it
            const hashedTxIdBuffer = await hmac(hmacKey, decryptedTransactionData.TransactionID);
            const hashedTransactionID = uint8ArrayToBase64String(new Uint8Array(hashedTxIdBuffer));

            // TODO: maybe spawn an error message here?
            await api.wallet
                .updateWalletTransactionHashedTxId(
                    walletId,
                    walletTransactionToHash.Data.WalletAccountID,
                    walletTransactionToHash.Data.ID,
                    hashedTransactionID
                )
                .catch(noop);

            const networkTx = transactionDataByHashedTxId[hashedTransactionID]?.[0];

            // If transaction was not in the record, we don't include it
            if (networkTx) {
                cloned[hashedTransactionID] = [
                    networkTx,
                    {
                        ...decryptedTransactionData,
                        HashedTransactionID: hashedTransactionID,
                    },
                ];
            }
        } catch (e) {
            // TODO: do something to avoid creating wallet transaction when error occurs here
            console.error('An error occured during transactin decryption, we will create a new transaction', e);
        }
    }

    return cloned;
};

const createMissingTxData = async ({
    api,
    userKeys,
    walletId,
    walletKey,
    accountIDByDerivationPathByWalletID,
    transactionsWithoutApiData,
    checkShouldAbort,
    onCreatedTransaction,
}: {
    api: WasmApiClients;
    userKeys: DecryptedKey[];
    walletId: string;
    walletKey: CryptoKey;
    accountIDByDerivationPathByWalletID: AccountIdByDerivationPathAndWalletId;
    transactionsWithoutApiData: [string, TransactionDataTuple][];
    checkShouldAbort: () => boolean;
    onCreatedTransaction: (record: TransactionDataByHashedTxId) => void;
}) => {
    const createdTransactionDataByHashedTxId: TransactionDataByHashedTxId = {};
    const [primaryUserKeys] = userKeys;

    for (const [hashedTxId, txData] of transactionsWithoutApiData) {
        if (checkShouldAbort()) {
            return createdTransactionDataByHashedTxId;
        }

        try {
            const [networkData] = txData;

            const normalisedDerivationPath = removeMasterPrefix(networkData.account_derivation_path);
            const accountId = accountIDByDerivationPathByWalletID[walletId]?.[normalisedDerivationPath];

            if (!accountId) {
                continue;
            }

            const txid = await encryptPgp(networkData.txid, [primaryUserKeys.publicKey]);

            // TODO: this can only occur on encryption error: we need to better handle that
            if (!txid) {
                continue;
            }

            const { Data: createdTransaction } = await api.wallet.createWalletTransaction(walletId, accountId, {
                txid,
                hashed_txid: hashedTxId,
                transaction_time: networkData.time?.confirmation_time
                    ? networkData.time?.confirmation_time.toString()
                    : Math.floor(Date.now() / SECOND).toString(),
                label: null,
                exchange_rate_id: null,
            });

            const decryptedTransactionData = await decryptTransactionData(
                createdTransaction,
                walletKey,
                userKeys.map((k) => k.privateKey)
            );

            const tupple: TransactionDataTuple = [networkData, decryptedTransactionData];

            createdTransactionDataByHashedTxId[hashedTxId] = tupple;
            onCreatedTransaction({ [hashedTxId]: tupple });
        } catch (error) {
            console.error('Could not create missing tx data', error);
        }
    }

    return createdTransactionDataByHashedTxId;
};

const fetchTransactions = async ({
    userPrivateKeys,
    transactionDataByHashedTxId,
    walletId,
    getTransactionsApiData,
    walletKey,
    allAddressKeys,
}: {
    userPrivateKeys: PrivateKeyReference[];
    transactionDataByHashedTxId: TransactionDataByHashedTxId;
    walletId: string;
    walletKey: CryptoKey;
    allAddressKeys: PrivateKeyReference[];
    getTransactionsApiData: ReturnType<typeof useGetApiWalletTransactionData>;
}) => {
    const hashedTxids = Object.keys(transactionDataByHashedTxId);

    const transactionsApiData = hashedTxids.length
        ? await getTransactionsApiData(walletId, undefined, hashedTxids)
        : [];

    // populate txData with api data
    for (const { Data: transactionApiData } of transactionsApiData) {
        const { HashedTransactionID } = transactionApiData;

        if (HashedTransactionID) {
            const txNetworkData = transactionDataByHashedTxId[HashedTransactionID]?.[0];

            if (txNetworkData) {
                const decryptedTransactionData = await decryptTransactionData(
                    transactionApiData,
                    walletKey,
                    userPrivateKeys,
                    allAddressKeys
                );

                transactionDataByHashedTxId[HashedTransactionID] = [txNetworkData, decryptedTransactionData];
            }
        }
    }

    return transactionDataByHashedTxId;
};

/**
 * This is hook is responsible for
 * - fetching API part of transaction
 * - reconciliate them through hmac hashing
 * - update transaction to add HashedTransactionID
 * - create missing transaction API data
 *
 */
export const useWalletTransactions = ({
    transactions,
    userKeys,
    wallet,
}: {
    transactions: WasmTransactionDetails[];
    userKeys?: DecryptedKey[];
    wallet?: IWasmApiWalletData;
}) => {
    const currentProcessUid = useRef(generateUID('use-wallet-transactions'));
    const clients = useWalletApiClients();

    const getTransactionsApiData = useGetApiWalletTransactionData();

    const [transactionDataByHashedTxId, setTransactionDataByHashedTxId] = useState<TransactionDataByHashedTxId>();
    const { accountIDByDerivationPathByWalletID } = useBitcoinBlockchainContext();
    const { createNotification } = useNotifications();

    const [loadingRecordInit, withLoadingRecordInit] = useLoading();
    const [loadingApiData, withLoadingApiData] = useLoading();

    const [addressesKeys] = useAddressesKeys();

    const allAddressKeys = useMemo(() => {
        return addressesKeys?.flatMap((a) => a.keys.map((k) => k.privateKey)) || [];
    }, [addressesKeys]);

    const fetchOrSetWalletTransactions = useCallback(async () => {
        if (!wallet || !userKeys) {
            return;
        }

        const userPrivateKeys = userKeys.map((k) => k.privateKey);

        const {
            WalletKey,
            Wallet: { ID: walletId },
        } = wallet;

        if (!WalletKey?.DecryptedKey) {
            return;
        }
        const processUid = generateUID('use-wallet-transactions');
        currentProcessUid.current = processUid;

        const checkShouldAbort = () => currentProcessUid.current !== processUid;

        // guard thats check that process is still current one, else do nothing
        const guardSetTransactionData = (
            value: SetStateAction<Partial<Record<string, TransactionDataTuple>> | undefined>
        ) => {
            (checkShouldAbort() ? noop : () => setTransactionDataByHashedTxId(value))();
        };

        const initResult = (await withLoadingRecordInit(async () => {
            const hmacKey = await decryptWalletKeyForHmac(WalletKey.WalletKey, WalletKey.WalletKeySignature, userKeys);
            const localTransactionDataByHashedTxId = await keyTxNetworkDataByHashedTxId(transactions, hmacKey);
            guardSetTransactionData(localTransactionDataByHashedTxId);

            // Return a clone of set reference, so that we can later mutate it and set it again
            return [hmacKey, { ...localTransactionDataByHashedTxId }] as const;
        })) as [CryptoKey, Partial<Record<string, TransactionDataTuple>>];

        const [hmacKey, localTransactionDataByHashedTxId] = initResult;
        const transactionDataByHashedTxId = await fetchTransactions({
            userPrivateKeys,
            transactionDataByHashedTxId: localTransactionDataByHashedTxId,
            walletId,
            getTransactionsApiData,
            walletKey: WalletKey.DecryptedKey,
            allAddressKeys,
        });

        guardSetTransactionData(transactionDataByHashedTxId);

        // If we already fetched all api data for the page, we don't need to go further
        if (compact(Object.values(transactionDataByHashedTxId)).every(([, api]) => !!api) || checkShouldAbort()) {
            return;
        }

        // Check if there are wallet transaction already created but not hashed yet
        const withMissingHashTransactions = await addMissingHashToWalletTransactions({
            api: clients,
            walletId,
            walletKey: WalletKey.DecryptedKey,
            transactionDataByHashedTxId: localTransactionDataByHashedTxId,
            userPrivateKeys,
            hmacKey,
            allAddressKeys,
            checkShouldAbort,
        });

        const transactionsWithoutApiData = filterTxWithoutApiData(withMissingHashTransactions);

        // If we already found all transactions's api data, we can just set them
        if (!transactionsWithoutApiData.length) {
            guardSetTransactionData((prev) => ({ ...prev, ...withMissingHashTransactions }));
        } else {
            guardSetTransactionData((prev) => ({ ...prev, ...withMissingHashTransactions }));

            // Else we create missing tx in api
            await createMissingTxData({
                api: clients,
                userKeys,
                walletId,
                walletKey: WalletKey.DecryptedKey,
                accountIDByDerivationPathByWalletID,
                transactionsWithoutApiData,
                checkShouldAbort,
                onCreatedTransaction: (record) => guardSetTransactionData((prev) => ({ ...prev, ...record })),
            });
        }
    }, [
        wallet,
        userKeys,
        withLoadingRecordInit,
        getTransactionsApiData,
        clients,
        allAddressKeys,
        transactions,
        accountIDByDerivationPathByWalletID,
    ]);

    const handleUpdatedTransaction = useCallback(
        async (updatedTx: WasmApiWalletTransaction, oldTransactionData: TransactionData) => {
            const { networkData } = oldTransactionData;

            if (!updatedTx || !userKeys) {
                return;
            }

            const { WalletAccountID } = updatedTx;

            if (WalletAccountID && wallet?.WalletKey?.DecryptedKey) {
                try {
                    const decryptedTransactionData = await decryptTransactionData(
                        updatedTx,
                        wallet.WalletKey.DecryptedKey,
                        userKeys.map((k) => k.privateKey),
                        allAddressKeys
                    );

                    const hashedTxId = updatedTx.HashedTransactionID;
                    const updatedTransactionData: TransactionData = {
                        networkData,
                        apiData: decryptedTransactionData,
                    };

                    if (hashedTxId) {
                        setTransactionDataByHashedTxId((prev) => ({
                            ...prev,
                            [hashedTxId]: [updatedTransactionData.networkData, updatedTransactionData.apiData],
                        }));
                    }

                    return updatedTransactionData;
                } catch (error: any) {
                    createNotification({
                        type: 'error',
                        text: error?.error ?? c('Wallet Transaction').t`Could not load updated transaction`,
                    });
                }
            }
        },
        [userKeys, wallet?.WalletKey, allAddressKeys, createNotification]
    );

    useEffect(() => {
        const bootstrap = async () => {
            await withLoadingApiData(fetchOrSetWalletTransactions());
        };

        void bootstrap();
    }, [withLoadingApiData, fetchOrSetWalletTransactions]);

    const transactionDetails: TransactionData[] | null = useMemo(() => {
        if (transactionDataByHashedTxId) {
            const transactions = Object.entries(transactionDataByHashedTxId) // typeguard: since record is partial, we first need to filter out keys with no value
                .filter((entry): entry is [string, TransactionDataTuple] => isTruthy(entry[1]))
                .map(([, [networkData, apiData]]) => ({ networkData, apiData }));

            transactions.sort((a, b) => {
                if (a.networkData.time.confirmed || b.networkData.time.confirmed) {
                    return 0;
                }

                const aTime = a.apiData?.TransactionTime ? Number(a.apiData.TransactionTime) : 0;
                const bTime = b.apiData?.TransactionTime ? Number(b.apiData.TransactionTime) : 0;
                return aTime - bTime;
            });

            return transactions;
        } else {
            return null;
        }
    }, [transactionDataByHashedTxId]);

    return {
        loadingRecordInit,
        loadingApiData,
        transactionDetails,

        handleUpdatedTransaction,
    };
};
