import { c } from 'ttag';

import type { IconName } from '@proton/components';
import { Icon, Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

import {
    isTransferCanceled,
    isTransferDone,
    isTransferError,
    isTransferManuallyPaused,
    isTransferProgress,
} from '../../utils/transfer';
import type { Download, Upload } from './transfer';
import { TransferState, TransferType } from './transfer';

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

    const statuses: { [key in TransferState]: { text: string; icon?: IconName } } = {
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
            icon: type === TransferType.Download ? 'arrow-down-line' : 'arrow-up-line',
        },
        [TransferState.Paused]: {
            text: c('Info').t`Paused`,
            icon: 'pause',
        },
        [TransferState.Done]: {
            text: type === TransferType.Download ? c('Info').t`Downloaded` : c('Info').t`Uploaded`,
            icon: 'checkmark',
        },
        [TransferState.Error]: {
            text: c('Info').t`Failed`,
            icon: 'exclamation-circle',
        },
        [TransferState.SignatureIssue]: {
            text: c('Info').t`Signature issue`,
        },
        [TransferState.ScanIssue]: {
            text: c('Info').t`Scan issue`,
        },
        [TransferState.NetworkError]: {
            text: c('Info').t`Network issue`,
            icon: 'exclamation-circle',
        },
        [TransferState.Skipped]: {
            text: c('Info').t`Skipped`,
            icon: 'cross',
        },
        [TransferState.Canceled]: {
            text: c('Info').t`Canceled`,
            icon: 'cross',
        },
        [TransferState.Finalizing]: {
            text: c('Info').t`Finalizing`,
            icon: 'checkmark',
        },
    };

    const statusInfo = statuses[transfer.state];

    const progressTitle = type === TransferType.Download ? c('Info').t`Downloading` : c('Info').t`Uploading`;
    const transferTitle = isTransferProgress(transfer) ? progressTitle : statusInfo.text;
    const errorText = transfer.error && getErrorText(transfer.error);

    return (
        <div
            className={clsx([
                'text-ellipsis flex *:min-size-auto items-center flex-nowrap',
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
                    <span className="shrink-0 md:hidden">
                        <Icon name={errorText ? 'info-circle' : statusInfo.icon} alt={statusInfo.text} />
                    </span>
                </Tooltip>
            )}

            {/* Desktop text */}
            <span className="hidden md:inline-flex text-ellipsis" data-testid="transfer-item-status">
                {errorText && (
                    <Tooltip title={errorText} originalPlacement="top">
                        <span className="flex items-center mr-2">
                            <Icon name="info-circle" />
                        </span>
                    </Tooltip>
                )}
                {statusInfo.text}
            </span>

            {shouldShowDirection && (
                <Icon
                    name={type === TransferType.Download ? 'arrow-down-line' : 'arrow-up-line'}
                    className={clsx(['shrink-0 ml-2', isTransferDone(transfer) && 'md:hidden'])}
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
