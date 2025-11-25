import { useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { NodeType } from '@proton/drive';
import { type UploadItem, UploadStatus, useUploadQueueStore } from '@proton/drive/modules/upload';

import {
    BaseTransferStatus,
    type DownloadItem,
    useDownloadManagerStore,
} from '../../zustand/download/downloadManager.store';

type TransferType = 'empty' | 'downloading' | 'uploading' | 'both';

export enum TransferManagerStatus {
    Empty = 'Empty',
    InProgress = 'InProgress',
    Failed = 'Failed',
    Cancelled = 'Cancelled',
    Finished = 'Finished',
}

type TransferManagerBaseEntry = {
    id: string;
    name: string;
    transferredBytes: number;
    lastStatusUpdateTime: Date;
};

type TransferManagerDownloadEntry = TransferManagerBaseEntry & {
    type: 'download';
    status: DownloadItem['status'] | BaseTransferStatus;
    storageSize: number;
};

type TransferManagerUploadEntry = TransferManagerBaseEntry & {
    type: 'upload';
    status: UploadItem['status'] | BaseTransferStatus;
    clearTextSize: number;
};

// TODO: we need to add the transfer speed in bytes from the stores
export type TransferManagerEntry = TransferManagerDownloadEntry | TransferManagerUploadEntry;

const mapDownload = ({
    downloadId,
    name,
    status,
    downloadedBytes,
    storageSize,
    lastStatusUpdateTime,
}: DownloadItem): TransferManagerDownloadEntry => ({
    type: 'download',
    id: downloadId,
    name,
    status,
    transferredBytes: downloadedBytes,
    storageSize: storageSize ?? 0,
    lastStatusUpdateTime,
});

const getUploadTransferredBytes = (item: UploadItem): number => {
    if (item.type === NodeType.File) {
        return item.uploadedBytes;
    }
    return item.status === UploadStatus.Finished ? 100 : 0;
};

const mapUpload = (item: UploadItem): TransferManagerUploadEntry => ({
    type: 'upload',
    id: item.uploadId,
    name: item.name,
    status: item.status,
    transferredBytes: getUploadTransferredBytes(item),
    clearTextSize: item.type === NodeType.File ? item.clearTextExpectedSize : 0,
    lastStatusUpdateTime: item.lastStatusUpdateTime,
});

const getShouldIgnoreTransferProgress = (
    status: TransferManagerDownloadEntry['status'] | TransferManagerUploadEntry['status']
) => {
    return (
        status === BaseTransferStatus.Cancelled ||
        status === BaseTransferStatus.Failed ||
        status === UploadStatus.Skipped ||
        status === UploadStatus.PhotosDuplicate
    );
};

export const useTransferManagerState = () => {
    const downloadQueue = useDownloadManagerStore(useShallow((state) => state.getQueue()));
    const uploadQueue = useUploadQueueStore(useShallow((state) => state.getQueue()));
    return useMemo(() => {
        const downloads = downloadQueue.map(mapDownload);
        const uploads = uploadQueue.map(mapUpload);
        const allTransfers = [...downloads, ...uploads];
        let status: TransferManagerStatus;

        // XXX: This is 4 loops on the same list but it's the most elegant way i can think of
        // there's a test to make sure it stays under 20ms with 10k elements
        const sumOfTransferredBytes = allTransfers.reduce((acc, transfer) => {
            let size = 0;
            if (!getShouldIgnoreTransferProgress(transfer.status)) {
                size = transfer.transferredBytes;
            }
            return acc + size;
        }, 0);
        const sumOfBytes = allTransfers.reduce((acc, transfer) => {
            let size = 0;
            if (!getShouldIgnoreTransferProgress(transfer.status)) {
                size = transfer.type === 'download' ? transfer.storageSize : transfer.clearTextSize;
            }
            return acc + size;
        }, 0);

        if (allTransfers.length === 0) {
            status = TransferManagerStatus.Empty;
        } else if (allTransfers.some((t) => t.status === BaseTransferStatus.InProgress)) {
            status = TransferManagerStatus.InProgress;
        } else if (allTransfers.some((t) => t.status === BaseTransferStatus.Failed)) {
            status = TransferManagerStatus.Failed;
        } else if (allTransfers.some((t) => t.status === BaseTransferStatus.Cancelled)) {
            status = TransferManagerStatus.Cancelled;
        } else {
            status = TransferManagerStatus.Finished;
        }

        const progressPercentage = sumOfBytes ? (sumOfTransferredBytes / sumOfBytes) * 100 : 0;

        let transferType: TransferType = 'empty';
        if (downloads.length && uploads.length) {
            transferType = 'both';
        } else if (downloads.length) {
            transferType = 'downloading';
        } else if (uploads.length) {
            transferType = 'uploading';
        }

        const getPriority = (status: BaseTransferStatus | UploadStatus | DownloadItem['status']) =>
            status === BaseTransferStatus.InProgress ? 1 : 0;

        const sortedTransfers = [...allTransfers].sort((a, b) => {
            const priorityDiff = getPriority(b.status) - getPriority(a.status);
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            const aTime = a.lastStatusUpdateTime.getTime();
            const bTime = b.lastStatusUpdateTime.getTime();
            return bTime - aTime;
        });

        return {
            downloads,
            uploads,
            items: sortedTransfers,
            transferType,
            progressPercentage,
            status,
        };
    }, [downloadQueue, uploadQueue]);
};
