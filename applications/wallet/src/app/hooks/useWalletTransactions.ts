import { SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { compact } from 'lodash';
import { c } from 'ttag';

import {
    WasmApiClients,
    WasmApiWalletAccount,
    WasmApiWalletTransaction,
    WasmTransactionDetails,
} from '@proton/andromeda';
import generateUID from '@proton/atoms/generateUID';
import { useGetAddressKeys, useNotifications } from '@proton/components/hooks';
import { PrivateKeyReference } from '@proton/crypto/lib';
import useLoading from '@proton/hooks/useLoading';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';
import {
    IWasmApiWalletData,
    WalletMap,
    decryptTextData,
    decryptWalletData,
    decryptWalletKeyForHmac,
    encryptPgp,
    encryptWalletDataWithWalletKey,
    hmac,
    useWalletApiClients,
} from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../contexts';
import { useGetApiWalletTransactionData } from '../store/hooks';
import { AccountIdByDerivationPathAndWalletId } from '../types';

type DecryptedTransactionData = Omit<WasmApiWalletTransaction, 'ToList' | 'TransactionID'> & {
    ToList: Partial<Record<string, string>>;
    TransactionID: string | null;
};

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
 * Decrypt transaction data. If addressKeys is not provided, we won't try to decrypt Body, Sender and ToList.
 *
 * Additionnally, TransactionID decryption might fail if Tx was created by a third party (using address keys)
 */
const decryptTransactionData = async (
    apiTransaction: WasmApiWalletTransaction,
    userKey: PrivateKeyReference,
    addressKeys?: PrivateKeyReference[]
): Promise<DecryptedTransactionData> => {
    const TransactionID = await decryptTextData(apiTransaction.TransactionID, [userKey, ...(addressKeys ?? [])]);

    if (!addressKeys) {
        return {
            ...apiTransaction,
            TransactionID,
            ToList: {},
        };
    }

    const Body = apiTransaction.Body && (await decryptTextData(apiTransaction.Body, addressKeys));
    const Sender = apiTransaction.Sender && (await decryptTextData(apiTransaction.Sender, addressKeys));
    const SerialisedToList = apiTransaction.ToList && (await decryptTextData(apiTransaction.ToList, addressKeys));

    const ToList = parsedRecipientList(SerialisedToList);

    return {
        ...apiTransaction,
        TransactionID,
        Body,
        Sender,
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
            .filter(([, [networkData, apiData]]) => networkData.time.confirmed && !apiData)
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
    api: WasmApiClients,
    walletId: string,
    walletMap: WalletMap,
    transactionDataByHashedTxId: TransactionDataByHashedTxId,
    userKey: DecryptedKey,
    hmacKey: CryptoKey,
    getWalletAccountPrimaryAddressKeys: (account: WasmApiWalletAccount) => Promise<PrivateKeyReference[]>
) => {
    const cloned: TransactionDataByHashedTxId = { ...transactionDataByHashedTxId };

    // TODO: check pagination
    const walletTransactionsToHash = await getWalletTransactionsToHash(api, walletId);

    for (const walletTransactionToHash of walletTransactionsToHash) {
        const account =
            walletTransactionToHash.Data.WalletAccountID &&
            walletMap[walletId]?.accounts[walletTransactionToHash.Data.WalletAccountID];

        if (!account) {
            // TODO: do something to avoid creating automatically transaction here?
            continue;
        }

        try {
            const accountPrimaryAddressKeys = await getWalletAccountPrimaryAddressKeys(account);

            // Decrypt txid
            const decryptedTransactionData = await decryptTransactionData(
                walletTransactionToHash.Data,
                userKey.privateKey,
                accountPrimaryAddressKeys
            );

            // TODO: this can only occur if decryption fails. We need to better handle that
            if (!decryptedTransactionData.TransactionID) {
                continue;
            }

            // Then hash it
            const hashedTxIdBuffer = await hmac(hmacKey, decryptedTransactionData.TransactionID);
            const hashedTransactionID = uint8ArrayToBase64String(new Uint8Array(hashedTxIdBuffer));

            // TODO: maybe spawn an error message here?
            await api.wallet
                .updateWalletTransactionHashedTxId(
                    walletId,
                    account.ID,
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
            console.error('An error occured during transactin decryption, we will create a new transaction');
        }
    }

    return cloned;
};

const createMissingTxData = async (
    api: WasmApiClients,
    userKey: DecryptedKey,
    walletId: string,
    accountIdByDerivationPathAndWalletId: AccountIdByDerivationPathAndWalletId,
    transactionsMissingApiData: [string, TransactionDataTuple][],
    onCreatedTransaction: (record: TransactionDataByHashedTxId) => void
) => {
    const createdTransactionDataByHashedTxId: TransactionDataByHashedTxId = {};

    for (const [hashedTxId, txData] of transactionsMissingApiData) {
        try {
            const [networkData] = txData;

            const accountId = accountIdByDerivationPathAndWalletId[walletId]?.[networkData.account_derivation_path];

            if (!accountId) {
                continue;
            }

            const txid = await encryptPgp(networkData.txid, [userKey.privateKey]);

            // TODO: this can only occur on encryption error: we need to better handle that
            if (!txid) {
                continue;
            }

            const { Data: createdTransaction } = await api.wallet.createWalletTransaction(walletId, accountId, {
                txid,
                hashed_txid: hashedTxId,
                transaction_time: networkData.time?.confirmation_time
                    ? networkData.time?.confirmation_time.toString()
                    : null,
                label: null,
                exchange_rate_id: null,
            });

            const decryptedTransactionData = await decryptTransactionData(createdTransaction, userKey.privateKey);

            const tupple: TransactionDataTuple = [networkData, decryptedTransactionData];

            createdTransactionDataByHashedTxId[hashedTxId] = tupple;
            onCreatedTransaction({ [hashedTxId]: tupple });
        } catch {}
    }

    return createdTransactionDataByHashedTxId;
};

const fetchTransactions = async ({
    userKeys,
    transactionDataByHashedTxId,
    walletId,
    getTransactionsApiData,
    walletMap,
    walletKey,
    getWalletAccountPrimaryAddressKeys,
}: {
    userKeys: DecryptedKey[];
    transactionDataByHashedTxId: TransactionDataByHashedTxId;
    walletId: string;
    getTransactionsApiData: ReturnType<typeof useGetApiWalletTransactionData>;
    walletMap: WalletMap;
    walletKey: CryptoKey;
    getWalletAccountPrimaryAddressKeys: (account: WasmApiWalletAccount) => Promise<PrivateKeyReference[]>;
}) => {
    const hashedTxids = Object.keys(transactionDataByHashedTxId);

    const [primaryUserKey] = userKeys;

    const transactionsApiData = hashedTxids.length
        ? await getTransactionsApiData(walletId, undefined, hashedTxids)
        : [];

    // populate txData with api data
    for (const { Data: transactionApiData } of transactionsApiData) {
        const { HashedTransactionID } = transactionApiData;

        // TODO: later WalletAccountID won't be nullable anymore, typeguard can be removed then
        const account =
            transactionApiData.WalletAccountID &&
            walletMap[transactionApiData.WalletID]?.accounts[transactionApiData.WalletAccountID];

        if (HashedTransactionID && account) {
            const txNetworkData = transactionDataByHashedTxId[HashedTransactionID]?.[0];

            if (txNetworkData) {
                const [decryptedLabel] = await decryptWalletData([transactionApiData.Label], walletKey).catch(() => []);

                const accountKeys = await getWalletAccountPrimaryAddressKeys(account);

                const decryptedTransactionData = await decryptTransactionData(
                    transactionApiData,
                    primaryUserKey.privateKey,
                    accountKeys
                );

                transactionDataByHashedTxId[HashedTransactionID] = [
                    txNetworkData,
                    { ...decryptedTransactionData, Label: decryptedLabel },
                ];
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

    const [transactionDataByHashedTxId, setTransactionDataByHashedTxId] = useState<TransactionDataByHashedTxId>({});
    const { accountIDByDerivationPathByWalletID, walletMap } = useBitcoinBlockchainContext();
    const { createNotification } = useNotifications();

    const [loadingRecordInit, withLoadingRecordInit] = useLoading();
    const [loadingApiData, withLoadingApiData] = useLoading();

    const getAddressesKeys = useGetAddressKeys();

    const getWalletAccountPrimaryAddressKeys = useCallback(
        (account: WasmApiWalletAccount) => {
            return Promise.all(
                account.Addresses.map((address) =>
                    getAddressesKeys(address.ID).then(([primaryAddressKey]) => primaryAddressKey.privateKey)
                )
            );
        },
        [getAddressesKeys]
    );

    const fetchOrSetWalletTransactions = useCallback(async () => {
        if (!wallet || !userKeys) {
            return;
        }

        const [primaryUserKey] = userKeys;
        const {
            WalletKey,
            Wallet: { ID: walletId },
        } = wallet;

        if (!WalletKey?.DecryptedKey) {
            return;
        }
        const processUid = generateUID('use-wallet-transactions');
        currentProcessUid.current = processUid;

        // guard thats check that process is still current one, else do nothing
        const guardSetTransactionData = (value: SetStateAction<Partial<Record<string, TransactionDataTuple>>>) => {
            (currentProcessUid.current === processUid ? () => setTransactionDataByHashedTxId(value) : noop)();
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
            userKeys,
            transactionDataByHashedTxId: localTransactionDataByHashedTxId,
            walletId,
            getTransactionsApiData,
            walletMap,
            walletKey: WalletKey.DecryptedKey,
            getWalletAccountPrimaryAddressKeys,
        });

        guardSetTransactionData(transactionDataByHashedTxId);

        // If we already fetched all api data for the page, we don't need to go further
        if (compact(Object.values(transactionDataByHashedTxId)).every(([, api]) => !!api)) {
            return;
        }

        // Check if there are wallet transaction already created but not hashed yet
        const withMissingHashTransactions = await addMissingHashToWalletTransactions(
            clients,
            walletId,
            walletMap,
            localTransactionDataByHashedTxId,
            primaryUserKey,
            hmacKey,
            getWalletAccountPrimaryAddressKeys
        );

        const transactionsWithoutApiData = filterTxWithoutApiData(withMissingHashTransactions);

        // If we already found all transactions's api data, we can just set them
        if (!transactionsWithoutApiData.length) {
            guardSetTransactionData((prev) => ({ ...prev, ...withMissingHashTransactions }));
        } else {
            guardSetTransactionData((prev) => ({ ...prev, ...withMissingHashTransactions }));
            // Else we create missing tx in api
            await createMissingTxData(
                clients,
                primaryUserKey,
                walletId,
                accountIDByDerivationPathByWalletID,
                transactionsWithoutApiData,
                (record) => guardSetTransactionData((prev) => ({ ...prev, ...record }))
            );
        }
    }, [
        wallet,
        userKeys,
        withLoadingRecordInit,
        getTransactionsApiData,
        clients,
        walletMap,
        getWalletAccountPrimaryAddressKeys,
        transactions,
        accountIDByDerivationPathByWalletID,
    ]);

    const updateWalletTransaction = useCallback(
        async (labelInput: string, txData: TransactionData) => {
            const { networkData, apiData } = txData;

            if (!apiData || !userKeys) {
                return;
            }

            const [primaryUserKey] = userKeys;

            const { WalletID, WalletAccountID, ID: TransactionID, Label } = apiData;

            // TODO: later WalletAccountID won't be nullable anymore, typeguard can be removed then
            const account = WalletAccountID && walletMap[WalletID]?.accounts[WalletAccountID];

            if (account && WalletAccountID && wallet?.WalletKey?.DecryptedKey && Label !== labelInput) {
                // TODO: later WalletAccountID won't be nullable anymore, typeguard can be removed then

                try {
                    const [encryptedLabel] = await encryptWalletDataWithWalletKey(
                        [labelInput],
                        wallet.WalletKey.DecryptedKey
                    );

                    const { Data: updatedTx } = await clients.wallet.updateWalletTransactionLabel(
                        WalletID,
                        WalletAccountID,
                        TransactionID,
                        encryptedLabel ?? ''
                    );

                    const accountKeys = await getWalletAccountPrimaryAddressKeys(account);
                    const decryptedTransactionData = await decryptTransactionData(
                        updatedTx,
                        primaryUserKey.privateKey,
                        accountKeys
                    );

                    const hashedTxId = updatedTx.HashedTransactionID;
                    if (hashedTxId) {
                        setTransactionDataByHashedTxId((prev) => ({
                            ...prev,
                            [hashedTxId]: [networkData, { ...decryptedTransactionData, Label: labelInput }],
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
        [userKeys, walletMap, wallet?.WalletKey, clients, getWalletAccountPrimaryAddressKeys, createNotification]
    );

    useEffect(() => {
        const bootstrap = async () => {
            await withLoadingApiData(fetchOrSetWalletTransactions());
        };

        void bootstrap();
    }, [withLoadingApiData, fetchOrSetWalletTransactions]);

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
