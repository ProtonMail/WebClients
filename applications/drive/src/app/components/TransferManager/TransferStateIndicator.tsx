import { Icon, classnames, Tooltip } from '@proton/components';
import { c } from 'ttag';
import { TransferState, Upload, Download, TransferType } from '@proton/shared/lib/interfaces/drive/transfer';
import {
    isTransferManuallyPaused,
    isTransferProgress,
    isTransferDone,
    isTransferError,
    isTransferCanceled,
} from '../../utils/transfer';

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
        [TransferState.Conflict]: {
            text: c('Info').t`Conflict`,
        },
        [TransferState.Pending]: {
            text: c('Info').t`Queued`,
            icon: 'clock',
        },
        [TransferState.Progress]: {
            text:
                type === TransferType.Upload && transfer.meta.mimeType === 'Folder'
                    ? c('Info').t`Creating`
                    : c('Info').t`${speed}/s`,
            icon: type === TransferType.Download ? 'arrow-down-to-rectangle' : 'arrow-up-from-rectangle',
        },
        [TransferState.Paused]: {
            text: c('Info').t`Paused`,
            icon: 'pause',
        },
        [TransferState.Done]: {
            text: type === TransferType.Download ? c('Info').t`Downloaded` : c('Info').t`Uploaded`,
            icon: 'check',
        },
        [TransferState.Error]: {
            text: c('Info').t`Failed`,
            icon: 'triangle-exclamation',
        },
        [TransferState.SignatureIssue]: {
            text: c('Info').t`Signature issue`,
        },
        [TransferState.NetworkError]: {
            text: c('Info').t`Network issue`,
            icon: 'triangle-exclamation',
        },
        [TransferState.Canceled]: {
            text: c('Info').t`Canceled`,
            icon: 'xmark',
        },
        [TransferState.Finalizing]: {
            text: c('Info').t`Finalizing`,
            icon: 'check',
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
                        <Icon name={errorText ? 'circle-info' : statusInfo.icon} alt={statusInfo.text} />
                    </span>
                </Tooltip>
            )}

            {/* Desktop text */}
            <span className="no-mobile text-ellipsis">
                {errorText && (
                    <Tooltip title={errorText} originalPlacement="top">
                        <span className="mr0-5">
                            <Icon name="circle-info" />
                        </span>
                    </Tooltip>
                )}
                {statusInfo.text}
            </span>

            {shouldShowDirection && (
                <Icon
                    name={type === TransferType.Download ? 'arrow-down-to-rectangle' : 'arrow-up-from-rectangle'}
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
