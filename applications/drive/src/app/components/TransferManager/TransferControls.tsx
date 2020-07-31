import React from 'react';
import { Icon, useLoading, usePreventLeave } from 'react-components';
import { c } from 'ttag';
import { useUploadProvider } from '../uploads/UploadProvider';
import { isTransferInitializing, isTransferPaused, isTransferFinished, isTransferFailed } from '../../utils/transfer';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { useDownloadProvider } from '../downloads/DownloadProvider';
import { LinkType } from '../../interfaces/link';
import useFiles from '../../hooks/drive/useFiles';
import { TransferType, TransferProps } from './interfaces';
import { Download, Upload } from '../../interfaces/transfer';

function TransferControls<T extends TransferType>({ transfer, type }: TransferProps<T>) {
    const { cancelDownload, removeDownload, pauseDownload, resumeDownload } = useDownloadProvider();
    const { startFolderTransfer, startFileTransfer, uploadDriveFile } = useFiles();
    const { removeUpload, cancelUpload, pauseUpload, resumeUpload } = useUploadProvider();
    const [pauseInProgress, withPauseInProgress] = useLoading();
    const isInitializing = isTransferInitializing(transfer);
    const isFinished = isTransferFinished(transfer);
    const isFailed = isTransferFailed(transfer);
    const { preventLeave } = usePreventLeave();

    const pauseText = type === TransferType.Download ? c('Action').t`Pause download` : c('Action').t`Pause upload`;
    const resumeText = type === TransferType.Download ? c('Action').t`Resume download` : c('Action').t`Resume upload`;
    const cancelText = type === TransferType.Download ? c('Action').t`Cancel download` : c('Action').t`Cancel upload`;
    const restartText =
        type === TransferType.Download ? c('Action').t`Restart download` : c('Action').t`Restart upload`;
    const removeText = c('Action').t`Remove from this list`;

    const handleClick = () => {
        if (type === TransferType.Download) {
            if (isFinished) {
                return removeDownload(transfer.id);
            }
            return cancelDownload(transfer.id);
        }
        if (type === TransferType.Upload) {
            if (isFinished) {
                return removeUpload(transfer.id);
            }
            return cancelUpload(transfer.id);
        }
    };

    const togglePause = () => {
        if (isTransferPaused(transfer)) {
            if (type === TransferType.Download) {
                resumeDownload(transfer.id);
            } else {
                resumeUpload(transfer.id);
            }
        } else if (type === TransferType.Download) {
            withPauseInProgress(pauseDownload(transfer.id)).catch(console.error);
        } else {
            pauseUpload(transfer.id);
        }
    };

    const restartDownload = async () => {
        const download = transfer as Download;
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

    const restartUpload = async () => {
        const upload = transfer as Upload;
        removeUpload(upload.id);
        const { file, ParentLinkID, ShareID } = upload.preUploadData;
        return preventLeave(uploadDriveFile(ShareID, ParentLinkID, file));
    };

    const restartTransfer = async () => {
        try {
            if (type === TransferType.Download) {
                await restartDownload();
            } else {
                await restartUpload();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const isPauseResumeAvailable = !isInitializing && !isFinished;
    const isRestartAvailable = isFailed;

    return (
        <div className="pd-transfers-listItem-controls flex flex-nowrap flex-justify-end">
            {isPauseResumeAvailable && (
                <button
                    type="button"
                    onClick={togglePause}
                    disabled={pauseInProgress}
                    className="pd-transfers-listItem-controls-button pm-button pm-button--for-icon flex flex-item-noshrink"
                    title={isTransferPaused(transfer) ? resumeText : pauseText}
                >
                    <Icon size={12} name={isTransferPaused(transfer) ? 'resume' : 'pause'} />
                </button>
            )}
            {isRestartAvailable && (
                <button
                    type="button"
                    onClick={restartTransfer}
                    className="pd-transfers-listItem-controls-button pm-button pm-button--for-icon flex flex-item-noshrink"
                    title={restartText}
                >
                    <Icon size={12} name="repeat" />
                </button>
            )}
            <button
                type="button"
                onClick={handleClick}
                className="pd-transfers-listItem-controls-button pm-button pm-button--for-icon flex flex-item-noshrink"
                title={isFinished ? removeText : cancelText}
            >
                <Icon size={12} name={isFinished ? 'swipe' : 'off'} />
            </button>
        </div>
    );
}

export default TransferControls;
