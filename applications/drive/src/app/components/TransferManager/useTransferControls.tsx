import { usePreventLeave } from '@proton/components';

import { useUploadProvider } from '../uploads/UploadProvider';
import { isTransferPaused, isTransferFinished } from '../../utils/transfer';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { useDownloadProvider } from '../downloads/DownloadProvider';
import { LinkType } from '../../interfaces/link';
import useFiles from '../../hooks/drive/useFiles';
import { Download, TransferType, Upload } from '../../interfaces/transfer';

function useTransferControls() {
    const { cancelDownload, removeDownload, pauseDownload, resumeDownload } = useDownloadProvider();
    const { startFolderTransfer, startFileTransfer } = useFiles();
    const { pauseUploads, resumeUploads, restartUploads, removeUploads, cancelUploads } = useUploadProvider();
    const { preventLeave } = usePreventLeave();

    const cancel = (transfer: Download | Upload, type: TransferType) => {
        if (type === TransferType.Download) {
            if (isTransferFinished(transfer)) {
                return removeDownload(transfer.id);
            }
            return cancelDownload(transfer.id);
        }
        if (type === TransferType.Upload) {
            if (isTransferFinished(transfer)) {
                return removeUploads(transfer.id);
            }
            return cancelUploads(transfer.id);
        }
    };

    const togglePause = async (transfer: Upload | Download, type: TransferType) => {
        if (isTransferPaused(transfer)) {
            if (type === TransferType.Download) {
                return resumeDownload(transfer.id);
            }
            return resumeUploads(transfer.id);
        }

        if (type === TransferType.Download) {
            return pauseDownload(transfer.id);
        }

        return pauseUploads(transfer.id);
    };

    const restartDownload = async (transfer: Download) => {
        const download = transfer;
        removeDownload(download.id);

        if (download.type === LinkType.FILE) {
            await preventLeave(
                FileSaver.saveAsFile(
                    await startFileTransfer(download.downloadInfo.ShareID, download.downloadInfo.LinkID, download.meta),
                    download.meta
                )
            );
        } else {
            const zipSaver = await FileSaver.saveAsZip(download.meta.filename);

            if (zipSaver) {
                try {
                    await preventLeave(
                        startFolderTransfer(
                            download.meta.filename,
                            download.downloadInfo.ShareID,
                            download.downloadInfo.LinkID,
                            download.downloadInfo.children,
                            {
                                onStartFileTransfer: zipSaver.addFile,
                                onStartFolderTransfer: zipSaver.addFolder,
                            }
                        )
                    );
                    await zipSaver.close();
                } catch (e: any) {
                    await zipSaver.abort(e);
                }
            }
        }
    };

    const restart = async (transfer: Download | Upload, type: TransferType) => {
        try {
            if (type === TransferType.Download) {
                await restartDownload(transfer as Download);
            } else {
                restartUploads(transfer.id);
            }
        } catch (e: any) {
            console.error(e);
        }
    };

    const pauseTransfers = (entries: { transfer: Download | Upload; type: TransferType }[]) => {
        entries.forEach((entry) => {
            if (!isTransferPaused(entry.transfer)) {
                const transferId = entry.transfer.id;
                if (entry.type === TransferType.Download) {
                    pauseDownload(transferId).catch(console.warn);
                    return;
                }

                pauseUploads(transferId); // todo call with callback once
            }
        });
    };

    const resumeTransfers = (entries: { transfer: Download | Upload; type: TransferType }[]) => {
        entries.forEach((entry) => {
            if (isTransferPaused(entry.transfer)) {
                const transferId = entry.transfer.id;
                if (entry.type === TransferType.Download) {
                    return resumeDownload(transferId);
                }

                resumeUploads(transferId); // todo call with callback once
            }
        });
    };

    const cancelTransfers = (entries: { transfer: Download | Upload; type: TransferType }[]) => {
        entries.forEach((entry) => {
            return entry.type === TransferType.Download
                ? cancelDownload(entry.transfer.id)
                : cancelUploads(entry.transfer.id); // todo call with callback once
        });
    };

    const restartTransfers = (entries: { transfer: Download | Upload; type: TransferType }[]) => {
        entries.forEach((entry) => {
            restart(entry.transfer, entry.type).catch(console.error);
        });
    };

    return {
        cancel,
        restart,
        togglePause,
        pauseTransfers,
        resumeTransfers,
        cancelTransfers,
        restartTransfers,
    };
}

export default useTransferControls;
