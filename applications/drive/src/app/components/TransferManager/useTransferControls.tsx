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
    const { startFolderTransfer, startFileTransfer, uploadDriveFile } = useFiles();
    const { removeUpload, cancelUpload, pauseUpload, resumeUpload } = useUploadProvider();
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
                return removeUpload(transfer.id);
            }
            return cancelUpload(transfer.id);
        }
    };

    const togglePause = async (transfer: Upload | Download, type: TransferType) => {
        if (isTransferPaused(transfer)) {
            if (type === TransferType.Download) {
                return resumeDownload(transfer.id);
            }
            return resumeUpload(transfer.id);
        }

        if (type === TransferType.Download) {
            return pauseDownload(transfer.id);
        }

        return pauseUpload(transfer.id);
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
                } catch (e) {
                    await zipSaver.abort(e);
                }
            }
        }
    };

    const restartUpload = async (transfer: Upload) => {
        const upload = transfer;
        removeUpload(upload.id);
        const { file, ParentLinkID, ShareID } = upload.preUploadData;
        return preventLeave(uploadDriveFile(ShareID, ParentLinkID, file));
    };

    const restart = async (transfer: Download | Upload, type: TransferType) => {
        try {
            if (type === TransferType.Download) {
                await restartDownload(transfer as Download);
            } else {
                await restartUpload(transfer as Upload);
            }
        } catch (e) {
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

                pauseUpload(transferId);
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

                resumeUpload(transferId);
            }
        });
    };

    const cancelTransfers = (entries: { transfer: Download | Upload; type: TransferType }[]) => {
        entries.forEach((entry) => {
            return entry.type === TransferType.Download
                ? cancelDownload(entry.transfer.id)
                : cancelUpload(entry.transfer.id);
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
