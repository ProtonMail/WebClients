import type { WasmApiWalletTransaction, WasmTransactionDetails } from '@proton/andromeda';

export type DecryptedTransactionData = Omit<WasmApiWalletTransaction, 'ToList' | 'TransactionID' | 'Sender'> & {
    Sender: SenderObject | string | null;
    ToList: Partial<Record<string, string>>;
    TransactionID: string | null;
};

export interface SenderObject {
    name?: string;
    email?: string;
}

export type TransactionDataTuple = [WasmTransactionDetails, DecryptedTransactionData | null];
export type TransactionDataByHashedTxId = Partial<Record<string, TransactionDataTuple>>;
export type NetworkTransactionByHashedTxId = Partial<
    Record<string, WasmTransactionDetails & { HashedTransactionID: string }>
>;

export interface TransactionData {
    networkData: WasmTransactionDetails;
    apiData: DecryptedTransactionData | null;
}
