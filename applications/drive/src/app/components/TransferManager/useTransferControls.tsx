import { useDownload, useUpload } from '../../store';
import { isTransferPaused } from '../../utils/transfer';
import type { Download, Upload } from './transfer';
import { TransferType } from './transfer';

function useTransferControls() {
    const {
        pauseDownloads,
        resumeDownloads,
        restartDownloads,
        cancelDownloads,
        removeDownloads,
        downloadDownloadLogs,
    } = useDownload();
    const { pauseUploads, resumeUploads, restartUploads, cancelUploads, removeUploads, downloadUploadLogs } =
        useUpload();

    const cancel = (transfer: Download | Upload, type: TransferType) => {
        if (type === TransferType.Download) {
            return cancelDownloads(transfer.id);
        }
        if (type === TransferType.Upload) {
            return cancelUploads(transfer.id);
        }
    };

    const remove = (transfer: Download | Upload, type: TransferType) => {
        if (type === TransferType.Download) {
            return removeDownloads(transfer.id);
        }
        if (type === TransferType.Upload) {
            return removeUploads(transfer.id);
        }
    };

    const togglePause = async (transfer: Upload | Download, type: TransferType) => {
        if (isTransferPaused(transfer)) {
            if (type === TransferType.Download) {
                return resumeDownloads(transfer.id);
            }
            return resumeUploads(transfer.id);
        }

        if (type === TransferType.Download) {
            return pauseDownloads(transfer.id);
        }

        return pauseUploads(transfer.id);
    };

    const restart = (transfer: Download | Upload, type: TransferType) => {
        try {
            if (type === TransferType.Download) {
                restartDownloads(transfer.id);
            } else {
                restartUploads(transfer.id);
            }
        } catch (e: any) {
            console.error(e);
        }
    };

    const pauseTransfers = (entries: { transfer: Download | Upload; type: TransferType }[]) => {
        const notPausedEntries = entries.filter(({ transfer }) => !isTransferPaused(transfer));
        applyToTransfers(notPausedEntries, pauseDownloads, pauseUploads);
    };

    const resumeTransfers = (entries: { transfer: Download | Upload; type: TransferType }[]) => {
        const pausedEntries = entries.filter(({ transfer }) => isTransferPaused(transfer));
        applyToTransfers(pausedEntries, resumeDownloads, resumeUploads);
    };

    const cancelTransfers = (entries: { transfer: Download | Upload; type: TransferType }[]) => {
        applyToTransfers(entries, cancelDownloads, cancelUploads);
    };

    const restartTransfers = (entries: { transfer: Download | Upload; type: TransferType }[]) => {
        applyToTransfers(entries, restartDownloads, restartUploads);
    };

    const downloadLogs = () => {
        downloadUploadLogs();
        downloadDownloadLogs();
    };

    return {
        cancel,
        remove,
        restart,
        togglePause,
        pauseTransfers,
        resumeTransfers,
        cancelTransfers,
        restartTransfers,
        downloadLogs,
    };
}

export default useTransferControls;

function applyToTransfers(
    entries: { transfer: Download | Upload; type: TransferType }[],
    downloadCallback: (id: string, transfer: Download) => void,
    uploadCallback: (filter: (data: { id: string }) => boolean) => void
) {
    entries
        .filter(({ type }) => type === TransferType.Download)
        .forEach(({ transfer }) => downloadCallback(transfer.id, transfer as Download));

    const uploadIds = entries.filter(({ type }) => type === TransferType.Upload).map(({ transfer: { id } }) => id);
    uploadCallback(({ id }) => uploadIds.includes(id));
}
