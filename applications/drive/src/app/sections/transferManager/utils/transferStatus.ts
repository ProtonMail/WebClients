import { UploadStatus } from '@proton/drive/modules/upload';

import { BaseTransferStatus } from '../../../zustand/download/downloadManager.store';
import type { TransferManagerEntry } from '../useTransferManagerState';

export const isCancellable = (entry: TransferManagerEntry): boolean => {
    return (
        entry.status === BaseTransferStatus.InProgress ||
        entry.status === BaseTransferStatus.Pending ||
        entry.status === UploadStatus.Preparing
    );
};

export const isRetryable = (entry: TransferManagerEntry): boolean => {
    return entry.status === BaseTransferStatus.Failed || entry.status === BaseTransferStatus.Cancelled;
};

export const isShareable = (entry: TransferManagerEntry): boolean => {
    return entry.status === BaseTransferStatus.Finished || entry.status === UploadStatus.PhotosDuplicate;
};
