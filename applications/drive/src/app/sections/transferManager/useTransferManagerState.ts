import { useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import {
    BaseTransferStatus,
    type DownloadItem,
    useDownloadManagerStore,
} from '../../zustand/download/downloadManager.store';
import { type UploadItem, useUploadQueueStore } from '../../zustand/upload/uploadQueue.store';

type TransferType = 'empty' | 'downloading' | 'uploading' | 'both';

export enum TransferManagerStatus {
    Empty = 'Empty',
    InProgress = 'InProgress',
    Failed = 'Failed',
    Cancelled = 'Cancelled',
    Finished = 'Finished',
}

type TransferManagerBaseEntry<Type extends 'download' | 'upload', Status> = {
    type: Type;
    id: string;
    name: string;
    status: Status;
    transferredBytes: number;
    storageSize: number;
};

// TODO: we need to add the transfer speed in bytes from the stores
export type TransferManagerEntry =
    | TransferManagerBaseEntry<'download', DownloadItem['status']>
    | TransferManagerBaseEntry<'upload', UploadItem['status']>;

const mapDownload = ({
    downloadId,
    name,
    status,
    downloadedBytes,
    storageSize,
}: DownloadItem): TransferManagerEntry => ({
    type: 'download',
    id: downloadId,
    name,
    status,
    transferredBytes: downloadedBytes,
    storageSize: storageSize ?? 0,
});

const mapUpload = ({
    uploadId,
    item: { name, status, uploadedBytes, clearTextExpectedSize },
}: {
    uploadId: string;
    item: UploadItem;
}): TransferManagerEntry => ({
    type: 'upload',
    id: uploadId,
    name,
    status,
    transferredBytes: uploadedBytes,
    storageSize: clearTextExpectedSize,
});

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
        const sumOfTransferredBytes = allTransfers.reduce((acc, transfer) => acc + transfer.transferredBytes, 0);
        const sumOfBytes = allTransfers.reduce((acc, transfer) => acc + transfer.storageSize, 0);

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

        return {
            downloads,
            uploads,
            items: allTransfers,
            transferType,
            progressPercentage,
            status,
        };
    }, [downloadQueue, uploadQueue]);
};
