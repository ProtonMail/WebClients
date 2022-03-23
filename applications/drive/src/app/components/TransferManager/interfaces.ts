import { Download, TransferType, Upload } from '@proton/shared/lib/interfaces/drive/transfer';

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

export interface TransferManagerButtonProps {
    disabled?: boolean;
    testId?: string;
    title: string;
    onClick: () => void;
    iconName: string;
}

export interface TransfersManagerButtonsProps {
    buttons: TransferManagerButtonProps[];
    className?: string;
    id?: string;
}
