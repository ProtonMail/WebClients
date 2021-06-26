import { Download, Upload } from '../../interfaces/transfer';

export interface DownloadProps {
    transfer: Download;
    type: TransferType.Download;
}

export interface UploadProps {
    transfer: Upload;
    type: TransferType.Upload;
}

export interface TransferProps<T extends TransferType> {
    transfer: T extends TransferType.Download ? Download : Upload;
    type: T;
}

export interface TransferStats {
    active: boolean;
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
