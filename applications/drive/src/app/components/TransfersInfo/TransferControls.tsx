import React from 'react';
import { useDownloadProvider } from '../downloads/DownloadProvider';
import { Icon, useLoading } from 'react-components';
import { c } from 'ttag';
import { useUploadProvider } from '../uploads/UploadProvider';
import { TransferType, UploadProps, DownloadProps } from './Transfer';
import { isTransferInitializing, isTransferPaused, isTransferFinished } from '../../utils/transfer';

function TransferControls({ transfer, type }: UploadProps | DownloadProps) {
    const { cancelDownload, removeDownload, pauseDownload, resumeDownload } = useDownloadProvider();
    const { removeUpload, cancelUpload } = useUploadProvider();
    const [pauseInProgress, withPauseInProgress] = useLoading();
    const isInitializing = isTransferInitializing(transfer);
    const isFinished = isTransferFinished(transfer);

    const pauseText = type === TransferType.Download ? c('Action').t`Pause download` : c('Action').t`Pause upload`;
    const resumeText = type === TransferType.Download ? c('Action').t`Resume download` : c('Action').t`Resume upload`;
    const cancelText = type === TransferType.Download ? c('Action').t`Cancel download` : c('Action').t`Cancel upload`;
    const removeText = c('Action').t`Remove from this list`;

    const handleClick = () => {
        switch (type) {
            case TransferType.Download:
                if (isFinished) {
                    return removeDownload(transfer.id);
                }
                return cancelDownload(transfer.id);
            case TransferType.Upload:
                if (isFinished) {
                    return removeUpload(transfer.id);
                }
                return cancelUpload(transfer.id);
        }
    };

    const togglePause = () => {
        if (isTransferPaused(transfer)) {
            resumeDownload(transfer.id);
        } else {
            withPauseInProgress(pauseDownload(transfer.id));
        }
    };

    return (
        <div className="pd-transfers-listItem-controls flex flex-nowrap flex-justify-end">
            {type === TransferType.Download && !isInitializing && !isFinished && (
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
            {
                <button
                    type="button"
                    onClick={handleClick}
                    className="pd-transfers-listItem-controls-button pm-button pm-button--for-icon flex flex-item-noshrink"
                    title={isFinished ? removeText : cancelText}
                >
                    <Icon size={12} name={isFinished ? 'swipe' : 'off'} />
                </button>
            }
        </div>
    );
}

export default TransferControls;
