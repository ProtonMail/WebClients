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
        let sumOfTransferredBytes = 0;
        let sumOfBytes = 0;
        const transfersFinished = [];

        // XXX: This is 4 loops on the same list but it's the most elegant way i can think of
        // there's a test to make sure it stays under 20ms with 10k elements
        for (const transfer of allTransfers) {
            const shouldIgnore = getShouldIgnoreTransferProgress(transfer.status);
            if (!shouldIgnore) {
                sumOfTransferredBytes = transfer.transferredBytes;
                sumOfBytes = transfer.type === 'download' ? transfer.storageSize : transfer.clearTextSize;
            }
            if (shouldIgnore || transfer.status === BaseTransferStatus.Finished) {
                transfersFinished.push(transfer);
            }
        }

        if (allTransfers.length === 0) {
            status = TransferManagerStatus.Empty;
        } else if (allTransfers.some((t) => t.status === BaseTransferStatus.InProgress)) {
            status = TransferManagerStatus.InProgress;
        } else if (allTransfers.some((t) => t.status === BaseTransferStatus.Failed)) {
            status = TransferManagerStatus.Failed;
        } else if (allTransfers.some((t) => t.status === BaseTransferStatus.Cancelled)) {
            status = TransferManagerStatus.Cancelled;
        } else if (allTransfers.some((t) => t.status === BaseTransferStatus.Pending)) {
            status = TransferManagerStatus.InProgress;
        } else {
            status = TransferManagerStatus.Finished;
        }

        let progressPercentage = sumOfBytes ? (sumOfTransferredBytes / sumOfBytes) * 100 : 0;
        // Edge case in which all transfers are cancelled/failed we should still show 100%
        if (sumOfBytes === 0 && allTransfers.length && allTransfers.length === transfersFinished.length) {
            progressPercentage = 100;
        }

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
