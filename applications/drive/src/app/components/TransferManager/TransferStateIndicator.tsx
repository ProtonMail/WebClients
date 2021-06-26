import React from 'react';
import { Icon, classnames, Tooltip } from '@proton/components';
import { c } from 'ttag';
import { TransferState, Upload, Download } from '../../interfaces/transfer';
import {
    isTransferManuallyPaused,
    isTransferProgress,
    isTransferDone,
    isTransferError,
    isTransferCanceled,
} from '../../utils/transfer';
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
    return error?.message || c('Info').t`Something went wrong, please try again later.`;
};

const TransferStateIndicator = ({ transfer, type, speed }: Props) => {
    const shouldShowDirection =
        isTransferProgress(transfer) ||
        isTransferManuallyPaused(transfer) ||
        isTransferCanceled(transfer) ||
        isTransferDone(transfer);

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
        [TransferState.NetworkError]: {
            text: c('Info').t`Network issue`,
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

    const progressTitle = type === TransferType.Download ? c('Info').t`Downloading` : c('Info').t`Uploading`;
    const transferTitle = isTransferProgress(transfer) ? progressTitle : statusInfo.text;
    const errorText = transfer.error && getErrorText(transfer.error);

    return (
        <div
            className={classnames([
                'text-ellipsis flex-no-min-children flex-align-items-center flex-nowrap',
                isTransferManuallyPaused(transfer) && 'color-info',
                isTransferDone(transfer) && 'color-success',
                isTransferError(transfer) && 'color-danger',
            ])}
            id={transfer.id}
            title={transferTitle}
        >
            {/* Mobile icon */}
            {statusInfo.icon && !isTransferProgress(transfer) && (
                <Tooltip title={errorText} originalPlacement="top">
                    <span className="flex-item-noshrink no-desktop no-tablet">
                        <Icon name={errorText ? 'info' : statusInfo.icon} alt={statusInfo.text} />
                    </span>
                </Tooltip>
            )}

            {/* Desktop text */}
            <span className="no-mobile text-ellipsis">
                {errorText && (
                    <Tooltip title={errorText} originalPlacement="top">
                        <span className="mr0-5">
                            <Icon name="info" />
                        </span>
                    </Tooltip>
                )}
                {statusInfo.text}
            </span>

            {shouldShowDirection && (
                <Icon
                    name={type === TransferType.Download ? 'download' : 'upload'}
                    className={classnames([
                        'flex-item-noshrink ml0-5',
                        isTransferDone(transfer) && 'no-tablet no-desktop',
                    ])}
                    alt={progressTitle}
                />
            )}

            {/* Hidden Info for screen readers */}
            <span className="sr-only" aria-atomic="true" aria-live="assertive">
                {transfer.meta.filename} {transferTitle}
            </span>
        </div>
    );
};

export default TransferStateIndicator;
