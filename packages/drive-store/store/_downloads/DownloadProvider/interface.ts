import type { TransferMeta, TransferState } from '../../../components/TransferManager/transfer';

export interface Download {
    meta: TransferMeta; // To be compatible with Download of TransferManager.
    state: TransferState;
    error?: Error;
    retries: number;
}
