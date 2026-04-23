import { MemberRole } from '@proton/drive/index';
import { UploadStatus } from '@proton/drive/modules/upload';

import { BaseTransferStatus } from '../../zustand/download/downloadManager.store';
import { useTransferManagerStore } from './transferManager.store';
import type { TransferManagerEntry } from './useTransferManagerState';

export const isCancellable = (entry: TransferManagerEntry): boolean => {
    return (
        entry.status === BaseTransferStatus.InProgress ||
        entry.status === BaseTransferStatus.Pending ||
        entry.status === UploadStatus.Preparing ||
        entry.status === UploadStatus.Waiting ||
        entry.status === UploadStatus.ConflictFound
    );
};

export const isRetryable = (entry: TransferManagerEntry): boolean => {
    return entry.status === BaseTransferStatus.Failed || entry.status === BaseTransferStatus.Cancelled;
};

export const isShareable = (entry: TransferManagerEntry): boolean => {
    return (
        (useTransferManagerStore.getState().getItem(entry.id)?.role === MemberRole.Admin &&
            entry.status === BaseTransferStatus.Finished) ||
        entry.status === UploadStatus.PhotosDuplicate
    );
};
