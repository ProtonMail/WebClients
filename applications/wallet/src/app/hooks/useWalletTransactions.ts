import { SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import {
    WasmApiWalletAccount,
    WasmApiWalletTransaction,
    WasmProtonWalletApiClient,
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
    decryptArmoredData,
    decryptWalletData,
    decryptWalletKey,
    decryptWalletKeyForHmac,
    encryptArmoredData,
    encryptWalletDataWithWalletKey,
    hmac,
    useWalletApi,
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
    const TransactionID = await decryptArmoredData(apiTransaction.TransactionID, [userKey, ...(addressKeys ?? [])]);

    if (!addressKeys) {
        return {
            ...apiTransaction,
            TransactionID,
            ToList: {},
        };
    }

    const Body = await decryptArmoredData(apiTransaction.Body, addressKeys);
    const Sender = await decryptArmoredData(apiTransaction.Sender, addressKeys);

    const SerialisedToList = await decryptArmoredData(apiTransaction.ToList, addressKeys);
    const ToList = parsedRecipientList(SerialisedToList);

    return {
        ...apiTransaction,
        TransactionID,
        Body,
        Sender,
        ToList,
    };
};

const getWalletTransactionsToHash = async (api: WasmProtonWalletApiClient, walletId: string) => {
    try {
        const walletTransactionsToHash = await api.wallet().getWalletTransactionsToHash(walletId);
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
    api: WasmProtonWalletApiClient,
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
            await api
                .wallet()
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
    api: WasmProtonWalletApiClient,
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

            const txid = await encryptArmoredData(networkData.txid, [userKey.privateKey]);

            // TODO: this can only occur on encryption error: we need to better handle that
            if (!txid) {
                continue;
            }

            const { Data: createdTransaction } = await api.wallet().createWalletTransaction(walletId, accountId, {
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
    const api = useWalletApi();

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

    const fetchWalletTransactions = useCallback(async () => {
        if (!wallet || !userKeys) {
            return;
        }

        const [primaryUserKey] = userKeys;

        const {
            WalletKey,
            Wallet: { ID: walletId },
        } = wallet;

        if (!WalletKey) {
            return;
        }

        const processUid = generateUID('use-wallet-transactions');
        currentProcessUid.current = processUid;

        // guard thats check that process is still current one, else do nothing
        const guardSetTransactionData = (value: SetStateAction<Partial<Record<string, TransactionDataTuple>>>) => {
            (currentProcessUid.current === processUid ? () => setTransactionDataByHashedTxId(value) : noop)();
        };

        const initResult = (await withLoadingRecordInit(async () => {
            const hmacKey = await decryptWalletKeyForHmac(WalletKey.WalletKey, userKeys);
            const localTransactionDataByHashedTxId = await keyTxNetworkDataByHashedTxId(transactions, hmacKey);

            guardSetTransactionData(localTransactionDataByHashedTxId);

            // Return a clone of set reference, so that we can later mutate it and set it again
            return [hmacKey, { ...localTransactionDataByHashedTxId }] as const;
        })) as [CryptoKey, Partial<Record<string, TransactionDataTuple>>];

        const [hmacKey, localTransactionDataByHashedTxId] = initResult;

        const hashedTxids = Object.keys(localTransactionDataByHashedTxId);

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
                const txNetworkData = localTransactionDataByHashedTxId[HashedTransactionID]?.[0];

                if (txNetworkData) {
                    const [decryptedLabel] = await decryptWalletData(
                        [transactionApiData.Label],
                        WalletKey.WalletKey,
                        userKeys
                    ).catch(() => []);

                    const accountKeys = await getWalletAccountPrimaryAddressKeys(account);

                    const decryptedTransactionData = await decryptTransactionData(
                        transactionApiData,
                        primaryUserKey.privateKey,
                        accountKeys
                    );

                    localTransactionDataByHashedTxId[HashedTransactionID] = [
                        txNetworkData,
                        { ...decryptedTransactionData, Label: decryptedLabel },
                    ];
                }
            }
        }

        guardSetTransactionData(localTransactionDataByHashedTxId);

        // If we already fetched all api data for the page, we don't need to go further
        if (transactionsApiData.length === hashedTxids.length) {
            return;
        }

        // Check if there are wallet transaction already created but not hashed yet
        const withMissingHashTransactions = await addMissingHashToWalletTransactions(
            api,
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
                api,
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
        api,
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

            if (account && WalletAccountID && wallet?.WalletKey?.WalletKey && Label !== labelInput) {
                // TODO: later WalletAccountID won't be nullable anymore, typeguard can be removed then

                try {
                    const decryptedKey = await decryptWalletKey(wallet.WalletKey.WalletKey, userKeys);
                    const [encryptedLabel] = await encryptWalletDataWithWalletKey([labelInput], decryptedKey);

                    const { Data: updatedTx } = await api
                        .wallet()
                        .updateWalletTransactionLabel(WalletID, WalletAccountID, TransactionID, encryptedLabel ?? '');

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
        [userKeys, walletMap, wallet?.WalletKey?.WalletKey, api, getWalletAccountPrimaryAddressKeys, createNotification]
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
