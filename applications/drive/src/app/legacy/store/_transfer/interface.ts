export type TransferType = 'upload' | 'download';

export interface TransferInitializationLog {
    transferType: TransferType;
    time: Date;
    message: string;
}
export interface TransferLog {
    transferType: TransferType;
    id: string;
    time: Date;
    message: string;
}
