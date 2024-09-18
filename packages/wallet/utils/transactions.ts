import type { WasmApiWalletTransaction, WasmTransactionDetails } from '@proton/andromeda';
import type { PrivateKeyReference } from '@proton/crypto';

import { decryptTextData, decryptWalletData } from './crypto';

export type DecryptedTransactionData = Omit<WasmApiWalletTransaction, 'ToList' | 'TransactionID' | 'Sender'> & {
    Sender: SenderObject | string | null;
    ToList: Partial<Record<string, string>>;
    TransactionID: string | null;
};

export interface SenderObject {
    name?: string;
    email?: string;
}

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
