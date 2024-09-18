import type { WasmApiClients, WasmApiWalletTransaction, WasmTransactionDetails } from '@proton/andromeda';
import type { PrivateKeyReference } from '@proton/crypto';
import { SECOND } from '@proton/shared/lib/constants';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type {
    AccountIdByDerivationPathAndWalletId,
    DecryptedTransactionData,
    NetworkTransactionByHashedTxId,
    SenderObject,
} from '../types';
import { removeMasterPrefix } from './account';
import { decryptTextData, decryptWalletData, encryptPgp, hmac } from './crypto';

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
export const decryptTransactionData = async (
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

export const buildNetworkTransactionByHashedTxId = async (
    transactions: WasmTransactionDetails[],
    hmacKey: CryptoKey
): Promise<NetworkTransactionByHashedTxId> => {
    return transactions.reduce((prevPromise, transaction) => {
        return prevPromise.then(async (acc) => {
            try {
                const hashedTxIdBuffer = await hmac(hmacKey, transaction.txid);
                const key = uint8ArrayToBase64String(new Uint8Array(hashedTxIdBuffer));

                return {
                    ...acc,
                    [key]: {
                        HashedTransactionID: key,
                        ...transaction,
                    },
                };
            } catch {
                return acc;
            }
        });
    }, Promise.resolve({}));
};

/**
 * Fetches transactions from the API, decrypts the transaction data, and returns the decrypted transactions.
 *
 */
export const fetchApiTransactions = async ({
    api,
    hashedTxids,
    walletId,
    walletKey,
    userPrivateKeys,
    addressesPrivateKeys,
}: {
    api: WasmApiClients;
    hashedTxids: string[] | undefined;
    walletId: string;
    walletKey: CryptoKey;
    userPrivateKeys: PrivateKeyReference[];
    addressesPrivateKeys: PrivateKeyReference[];
}) => {
    const transactionsApiData = await api.wallet
        .getWalletTransactions(walletId, undefined, hashedTxids)
        .then((data) => data[0]);

    const fetched: DecryptedTransactionData[] = [];

    // populate txData with api data
    for (const { Data: transactionApiData } of transactionsApiData) {
        const { HashedTransactionID } = transactionApiData;

        if (HashedTransactionID) {
            const decryptedTransactionData = await decryptTransactionData(
                transactionApiData,
                walletKey,
                userPrivateKeys,
                addressesPrivateKeys
            );

            fetched.push(decryptedTransactionData);
        }
    }

    return fetched;
};

/**
 * Encrypts the transaction data, creates new transactions in the API and then returns
 * the created transactions.
 */
export const createApiTransactions = async ({
    api,
    walletId,
    walletKey,
    accountIDByDerivationPathByWalletID,
    transactionsWithoutApiData,
    userKeys,
    checkShouldAbort,
}: {
    api: WasmApiClients;
    walletId: string;
    walletKey: CryptoKey;
    accountIDByDerivationPathByWalletID: AccountIdByDerivationPathAndWalletId;
    transactionsWithoutApiData: (WasmTransactionDetails & { HashedTransactionID: string })[];
    userKeys: DecryptedKey[];
    checkShouldAbort: () => boolean;
}) => {
    const created: DecryptedTransactionData[] = [];
    const [primaryUserKeys] = userKeys;

    for (const transaction of transactionsWithoutApiData) {
        if (checkShouldAbort()) {
            break;
        }

        try {
            const normalisedDerivationPath = removeMasterPrefix(transaction.account_derivation_path);
            const accountId = accountIDByDerivationPathByWalletID[walletId]?.[normalisedDerivationPath];

            if (!accountId) {
                continue;
            }

            const txid = await encryptPgp(transaction.txid, [primaryUserKeys.publicKey]);

            // TODO: this can only occur on encryption error: we need to better handle that
            if (!txid) {
                continue;
            }

            const { Data: createdTransaction } = await api.wallet.createWalletTransaction(walletId, accountId, {
                txid,
                hashed_txid: transaction.HashedTransactionID,
                transaction_time: transaction.time?.confirmation_time
                    ? transaction.time?.confirmation_time.toString()
                    : Math.floor(Date.now() / SECOND).toString(),
                label: null,
                exchange_rate_id: null,
            });

            const decryptedTransactionData = await decryptTransactionData(
                createdTransaction,
                walletKey,
                userKeys.map((k) => k.privateKey)
            );

            created.push(decryptedTransactionData);
        } catch (error) {
            console.error('Could not create missing tx data', error);
        }
    }

    return created;
};

const getWalletTransactionsToHash = async (api: WasmApiClients, walletId: string) => {
    try {
        const walletTransactionsToHash = await api.wallet.getWalletTransactionsToHash(walletId);
        return walletTransactionsToHash[0];
    } catch {
        return [];
    }
};

/**
 * This function hashes API transactions by first decrypting the transaction data,
 * then hashing the transaction ID, and finally updating the transaction with the hashed ID.
 */
export const hashApiTransactions = async ({
    api,
    walletId,
    walletKey,
    hmacKey,
    userPrivateKeys,
    addressesPrivateKeys,
    checkShouldAbort,
}: {
    api: WasmApiClients;
    walletId: string;
    walletKey: CryptoKey;
    hmacKey: CryptoKey;
    userPrivateKeys: PrivateKeyReference[];
    addressesPrivateKeys: PrivateKeyReference[];
    checkShouldAbort: () => boolean;
}) => {
    const hashed: DecryptedTransactionData[] = [];

    // TODO: check pagination
    const walletTransactionsToHash = await getWalletTransactionsToHash(api, walletId);

    for (const walletTransactionToHash of walletTransactionsToHash) {
        if (checkShouldAbort()) {
            break;
        }

        try {
            // Decrypt txid
            const decryptedTransactionData = await decryptTransactionData(
                walletTransactionToHash.Data,
                walletKey,
                userPrivateKeys,
                addressesPrivateKeys
            );

            // TODO: this can only occur if decryption fails. We need to better handle that
            if (!decryptedTransactionData.TransactionID || !walletTransactionToHash.Data.WalletAccountID) {
                continue;
            }

            // Then hash it
            const hashedTxIdBuffer = await hmac(hmacKey, decryptedTransactionData.TransactionID);
            const hashedTransactionID = uint8ArrayToBase64String(new Uint8Array(hashedTxIdBuffer));

            await api.wallet
                .updateWalletTransactionHashedTxId(
                    walletId,
                    walletTransactionToHash.Data.WalletAccountID,
                    walletTransactionToHash.Data.ID,
                    hashedTransactionID
                )
                .catch(noop);

            hashed.push({
                ...decryptedTransactionData,
                HashedTransactionID: hashedTransactionID,
            });
        } catch (e) {
            // TODO: do something to avoid creating wallet transaction when error occurs here
            console.error('An error occured during transactin decryption, we will create a new transaction', e);
        }
    }

    return hashed;
};
