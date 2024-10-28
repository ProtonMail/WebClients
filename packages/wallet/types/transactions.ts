import type { WasmApiWalletTransaction, WasmTransactionDetails } from '@proton/andromeda';
import { type SimpleMap } from '@proton/shared/lib/interfaces';

export type DecryptedTransactionData = Omit<WasmApiWalletTransaction, 'ToList' | 'TransactionID' | 'Sender'> & {
    Sender: SenderObject | string | null;
    ToList: SimpleMap<string>;
    TransactionID: string | null;
};

export interface SenderObject {
    name?: string;
    email?: string;
}

export type TransactionDataTuple = [WasmTransactionDetails, DecryptedTransactionData | null];
export type TransactionDataByHashedTxId = SimpleMap<TransactionDataTuple>;
export type NetworkTransactionByHashedTxId = SimpleMap<WasmTransactionDetails & { HashedTransactionID: string }>;

export interface TransactionData {
    networkData: WasmTransactionDetails;
    apiData: DecryptedTransactionData | null;
}
