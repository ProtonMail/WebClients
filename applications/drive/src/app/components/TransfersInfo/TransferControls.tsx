import React from 'react';
import { useDownloadProvider } from '../downloads/DownloadProvider';
import { Icon, useLoading } from 'react-components';
import { TransferState } from '../../interfaces/transfer';
import { c } from 'ttag';
import { useUploadProvider } from '../uploads/UploadProvider';
import { TransferType, UploadProps, DownloadProps } from './Transfer';

function TransferControls({ transfer, type }: UploadProps | DownloadProps) {
    const { cancelDownload, removeDownload, pauseDownload, resumeDownload } = useDownloadProvider();
    const { removeUpload } = useUploadProvider();
    const isFinished = [TransferState.Done, TransferState.Error, TransferState.Canceled].includes(transfer.state);
    const [pauseInProgress, withPauseInProgress] = useLoading();

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
        }
    };

    const togglePause = () => {
        if (transfer.state === TransferState.Paused) {
            resumeDownload(transfer.id);
        } else {
            withPauseInProgress(pauseDownload(transfer.id));
        }
    };

    return (
        <span className="pd-transfers-controls flex-item-fluid flex flex-nowrap flex-justify-end">
            {!isFinished && (
                <button
                    type="button"
                    onClick={togglePause}
                    disabled={pauseInProgress}
                    className="pd-transfers-controlButton pm-button--info pm-button--for-icon rounded50 flex-item-noshrink flex mr0-25"
                    title={
                        transfer.state === TransferState.Paused
                            ? c('Action').t`Resume transfer`
                            : c('Action').t`Pause transfer`
                    }
                >
                    <Icon size={12} name={transfer.state === TransferState.Paused ? 'resume' : 'pause'} />
                </button>
            )}
            <button
                type="button"
                onClick={handleClick}
                className="pd-transfers-controlButton pm-button--info pm-button--for-icon rounded50 flex-item-noshrink flex"
                title={isFinished ? c('Action').t`Remove from this list` : c('Action').t`Cancel transfer`}
            >
                <Icon size={12} name="off" />
            </button>
        </span>
    );
}

export default TransferControls;
