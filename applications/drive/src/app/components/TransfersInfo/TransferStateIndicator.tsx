import React from 'react';
import { TransferState, Upload, Download } from '../../interfaces/transfer';
import { TransferType } from './Transfer';
import { Icon, classnames } from 'react-components';
import { c } from 'ttag';
import { isTransferPaused, isTransferProgress, isTransferDone, isTransferError } from '../../utils/transfer';

interface Props {
    transfer: Upload | Download;
    type: string;
    speed: string;
}

const TransferStateIndicator = ({ transfer, type, speed }: Props) => {
    const progressTitle = type === TransferType.Download ? c('Info').t`Downloading` : c('Info').t`Uploading`;

    const statusInfo = {
        [TransferState.Initializing]: {
            text: c('Info').t`Initializing`
        },
        [TransferState.Pending]: {
            text: c('Info').t`Queued`,
            icon: 'clock'
        },
        [TransferState.Progress]: {
            text: c('Info').t`${speed}/s`,
            icon: type === TransferType.Download ? 'download' : 'upload'
        },
        [TransferState.Paused]: {
            text: c('Info').t`Paused`,
            icon: 'pause'
        },
        [TransferState.Done]: {
            text: type === TransferType.Download ? c('Info').t`Downloaded` : c('Info').t`Uploaded`,
            icon: 'on'
        },
        [TransferState.Error]: {
            text: c('Info').t`Failed`,
            icon: 'attention'
        },
        [TransferState.Canceled]: {
            text: c('Info').t`Canceled`,
            icon: 'off'
        }
    }[transfer.state];

    return (
        <div
            className={classnames([
                'ellipsis',
                isTransferPaused(transfer) && 'color-global-info',
                isTransferDone(transfer) && 'color-global-success',
                isTransferError(transfer) && 'color-global-warning'
            ])}
            id={transfer.id}
            title={isTransferProgress(transfer) ? progressTitle : statusInfo.text}
        >
            {statusInfo.icon && !isTransferProgress(transfer) && (
                <Icon name={statusInfo.icon} className="flex-item-noshrink mr0-25 nodesktop notablet" />
            )}

            <span className="nomobile">{statusInfo.text}</span>

            <span className="sr-only" aria-atomic="true" aria-live="assertive">
                {transfer.meta.filename} {isTransferProgress(transfer) ? progressTitle : statusInfo.text}
            </span>

            {statusInfo.icon && isTransferProgress(transfer) && (
                <Icon name={statusInfo.icon} className="flex-item-noshrink ml0-5 notablet" />
            )}
        </div>
    );
};

export default TransferStateIndicator;
