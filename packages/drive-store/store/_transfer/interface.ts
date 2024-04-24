export type TransferType = 'upload' | 'download';

export interface TransferLog {
    transferType: TransferType;
    id: string;
    time: Date;
    message: string;
}
