import { useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import {
    BaseTransferStatus,
    type DownloadItem,
    useDownloadManagerStore,
} from '../../zustand/download/downloadManager.store';
import type { UploadUIItem } from '../../zustand/upload/uploadUI.store';
import { useUploadUIStore } from '../../zustand/upload/uploadUI.store';

type TransferType = 'empty' | 'downloading' | 'uploading' | 'both';

export enum TransferManagerStatus {
    Empty = 'Empty',
    InProgress = 'InProgress',
    Failed = 'Failed',
    Cancelled = 'Cancelled',
    Finished = 'Finished',
}

// TODO: we need to add the transfer speed in bytes from the stores
export type TransferManagerEntry = {
    type: 'download' | 'upload';
    id: string;
    name: string;
    status: string;
    transferredBytes: number;
    storageSize: number;
};

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

const mapUpload = ({ uploadId, name, status, progress }: UploadUIItem): TransferManagerEntry => ({
    type: 'upload',
    id: uploadId,
    name,
    status,
    transferredBytes: progress, // TODO: replace with uploaded bytes when available
    storageSize: 100, // TODO: replace with actual size when available
});

export const useTransferManagerState = () => {
    const downloadQueue = useDownloadManagerStore(useShallow((state) => state.getQueue()));
    const uploadQueue = useUploadUIStore(useShallow((state) => state.getAll()));

    return useMemo(() => {
        const downloads = downloadQueue.map(mapDownload);
        const uploads = uploadQueue.map(mapUpload);
        const allTransfers = [...downloads, ...uploads];
        let status: TransferManagerStatus;

        // XXX: This is 4 loops on the same list but it's the most elegant way i can think of
        // this list should be pretty short with slow updates so not a bottleneck
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
