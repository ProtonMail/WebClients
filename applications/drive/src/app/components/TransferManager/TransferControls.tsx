import { useLoading, usePreventLeave } from '@proton/components';
import { c } from 'ttag';

import { useUploadProvider } from '../uploads/UploadProvider';
import {
    isTransferInitializing,
    isTransferPaused,
    isTransferFinished,
    isTransferFailed,
    isTransferFinalizing,
} from '../../utils/transfer';
import FileSaver from '../../utils/FileSaver/FileSaver';
import { useDownloadProvider } from '../downloads/DownloadProvider';
import { LinkType } from '../../interfaces/link';
import useFiles from '../../hooks/drive/useFiles';
import { TransferManagerButtonProps, TransferProps } from './interfaces';
import { Download, TransferType, Upload } from '../../interfaces/transfer';
import Buttons from './Buttons';

function TransferControls<T extends TransferType>({ transfer, type }: TransferProps<T>) {
    const { cancelDownload, removeDownload, pauseDownload, resumeDownload } = useDownloadProvider();
    const { startFolderTransfer, startFileTransfer, uploadDriveFile } = useFiles();
    const { removeUpload, cancelUpload, pauseUpload, resumeUpload } = useUploadProvider();
    const [pauseInProgress, withPauseInProgress] = useLoading();
    const isInitializing = isTransferInitializing(transfer);
    const isFinished = isTransferFinished(transfer);
    const isFailed = isTransferFailed(transfer);
    const isFinalizing = isTransferFinalizing(transfer);
    const { preventLeave } = usePreventLeave();

    const pauseText = type === TransferType.Download ? c('Action').t`Pause download` : c('Action').t`Pause upload`;
    const resumeText = type === TransferType.Download ? c('Action').t`Resume download` : c('Action').t`Resume upload`;
    const cancelText = type === TransferType.Download ? c('Action').t`Cancel download` : c('Action').t`Cancel upload`;
    const restartText =
        type === TransferType.Download ? c('Action').t`Restart download` : c('Action').t`Restart upload`;
    const removeText = c('Action').t`Remove from this list`;

    const handleCancelClick = () => {
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

    const isPauseResumeAvailable = !isInitializing && !isFinished && !isFinalizing;
    const isRestartAvailable = isFailed;

    const getButtons = () => {
        const buttons: TransferManagerButtonProps[] = [];
        if (isPauseResumeAvailable) {
            buttons.push({
                onClick: togglePause,
                disabled: pauseInProgress,
                title: isTransferPaused(transfer) ? resumeText : pauseText,
                iconName: isTransferPaused(transfer) ? 'play' : 'pause',
            });
        }

        if (isRestartAvailable) {
            buttons.push({
                onClick: restartTransfer,
                title: restartText,
                iconName: 'arrow-rotate-right',
            });
        }

        buttons.push({
            onClick: handleCancelClick,
            title: isFinished ? removeText : cancelText,
            disabled: isFinalizing,
            iconName: isFinished ? 'brush' : 'xmark',
        });

        return buttons;
    };

    return <Buttons className="transfers-manager-list-item-controls" buttons={getButtons()} />;
}

export default TransferControls;
