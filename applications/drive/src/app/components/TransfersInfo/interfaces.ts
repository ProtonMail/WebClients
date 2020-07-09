import { TransferState, Download, Upload } from '../../interfaces/transfer';

export interface DownloadProps {
    transfer: Download;
    type: TransferType.Download;
}

export interface UploadProps {
    transfer: Upload;
    type: TransferType.Upload;
}

export interface TransferStats {
    state: TransferState;
    progress: number;
    speed: number;
}
export interface TransfersStats {
    timestamp: Date;
    stats: { [id: string]: TransferStats };
}

export enum TransferType {
    Download = 'download',
    Upload = 'upload',
}
