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
        const notPausedEntries = entries.filter(({ transfer }) => !isTransferPaused(transfer));
        applyToTransfers(
            notPausedEntries,
            (id) => {
                pauseDownload(id).catch(console.warn);
            },
            pauseUploads
        );
    };

    const resumeTransfers = (entries: { transfer: Download | Upload; type: TransferType }[]) => {
        const pausedEntries = entries.filter(({ transfer }) => isTransferPaused(transfer));
        applyToTransfers(pausedEntries, resumeDownload, resumeUploads);
    };

    const cancelTransfers = (entries: { transfer: Download | Upload; type: TransferType }[]) => {
        applyToTransfers(entries, cancelDownload, cancelUploads);
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

function applyToTransfers(
    entries: { transfer: Download | Upload; type: TransferType }[],
    downloadCallback: (id: string) => void,
    uploadCallback: (filter: (data: { id: string }) => boolean) => void
) {
    entries
        .filter(({ type }) => type === TransferType.Download)
        .forEach(({ transfer: { id } }) => downloadCallback(id));

    const uploadIds = entries.filter(({ type }) => type === TransferType.Upload).map(({ transfer: { id } }) => id);
    uploadCallback(({ id }) => uploadIds.includes(id));
}
