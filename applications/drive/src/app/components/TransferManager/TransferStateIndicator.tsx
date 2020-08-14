import React from 'react';
import { Icon, classnames, Tooltip } from 'react-components';
import { c } from 'ttag';
import { TransferState, Upload, Download } from '../../interfaces/transfer';
import { isTransferPaused, isTransferProgress, isTransferDone, isTransferError } from '../../utils/transfer';
import { TransferType } from './interfaces';

interface Props {
    transfer: Upload | Download;
    type: string;
    speed: string;
}

const getErrorText = (error: any) => {
    if (error?.data?.Error) {
        return error.data.Error;
    }
    return error?.message;
};

const TransferStateIndicator = ({ transfer, type, speed }: Props) => {
    const progressTitle = type === TransferType.Download ? c('Info').t`Downloading` : c('Info').t`Uploading`;

    const statusInfo = {
        [TransferState.Initializing]: {
            text: c('Info').t`Initializing`,
        },
        [TransferState.Pending]: {
            text: c('Info').t`Queued`,
            icon: 'clock',
        },
        [TransferState.Progress]: {
            text: c('Info').t`${speed}/s`,
            icon: type === TransferType.Download ? 'download' : 'upload',
        },
        [TransferState.Paused]: {
            text: c('Info').t`Paused`,
            icon: 'pause',
        },
        [TransferState.Done]: {
            text: type === TransferType.Download ? c('Info').t`Downloaded` : c('Info').t`Uploaded`,
            icon: 'on',
        },
        [TransferState.Error]: {
            text: c('Info').t`Failed`,
            icon: 'attention',
        },
        [TransferState.Canceled]: {
            text: c('Info').t`Canceled`,
            icon: 'off',
        },
        [TransferState.Finalizing]: {
            text: c('Info').t`Finalizing`,
            icon: 'on',
        },
    }[transfer.state];

    const errorText = transfer.error && getErrorText(transfer.error);

    return (
        <div
            className={classnames([
                'ellipsis flex flex-items-center',
                isTransferPaused(transfer) && 'color-global-info',
                isTransferDone(transfer) && 'color-global-success',
                isTransferError(transfer) && 'color-global-warning',
            ])}
            id={transfer.id}
            title={isTransferProgress(transfer) ? progressTitle : statusInfo.text}
        >
            {statusInfo.icon && !isTransferProgress(transfer) && (
                <Tooltip title={errorText} originalPlacement="top">
                    <Icon
                        name={errorText ? 'info' : statusInfo.icon}
                        className="flex-item-noshrink mr0-25 nodesktop notablet"
                        alt={statusInfo.text}
                    />
                </Tooltip>
            )}

            <span className="nomobile flex flex-items-center">
                {errorText && (
                    <Tooltip title={errorText} originalPlacement="top" className="flex mr0-5">
                        <Icon name="info" />
                    </Tooltip>
                )}
                {statusInfo.text}
            </span>

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
