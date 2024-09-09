import * as React from 'react';

import { FileIcon, FileNameDisplay, Loader } from '@proton/components';
import humanSize, { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import {
    getProgressBarStatus,
    isTransferCanceled,
    isTransferDone,
    isTransferInitializing,
    isTransferPaused,
    isTransferPending,
    isTransferProgress,
    isTransferSkipped,
} from '../../utils/transfer';
import ProgressBar from './ProgressBar';
import TransferControls from './TransferControls';
import TransferStateIndicator from './TransferStateIndicator';
import type { TransferProps } from './interfaces';
import { TransferType } from './transfer';

type Props<T extends TransferType> = React.HTMLAttributes<HTMLDivElement> &
    TransferProps<T> & {
        stats: {
            progress: number;
            speed: number;
        };
    };

const Transfer = <T extends TransferType>({ stats, transfer, type, className, ...rest }: Props<T>) => {
    const isInitializing = isTransferInitializing(transfer);
    const isNameUnresolved = isInitializing || isTransferPending(transfer);
    const isProgress = isTransferProgress(transfer);
    const isPaused = isTransferPaused(transfer);
    const isCanceled = isTransferCanceled(transfer);
    const isSkipped = isTransferSkipped(transfer);
    const isDone = isTransferDone(transfer);

    const fileSize = transfer.meta.size;
    const progressLimit = fileSize || 1;
    const percentageDone = isDone ? 100 : !fileSize ? 0 : Math.floor(100 * (stats.progress / fileSize));

    const progress = isDone ? progressLimit : stats.progress;
    const speed = humanSize({ bytes: stats.speed });

    const isUploadingFolder = type === TransferType.Upload && transfer.meta.mimeType === 'Folder';

    return (
        <div
            className={clsx([
                'transfers-manager-list-item p-4',
                (isCanceled || isSkipped) && 'transfers-manager-list-item--canceled',
                className,
            ])}
            data-testid="transfer-item-row"
            {...rest}
        >
            <div className="transfers-manager-list-item-name flex flex-nowrap items-center text-ellipsis">
                <span className="transfers-manager-list-item-icon flex shrink-0 mr-2">
                    {isInitializing ? <Loader size="small" /> : <FileIcon mimeType={transfer.meta.mimeType} />}
                </span>
                <span className={clsx(['flex', isNameUnresolved && 'color-weak'])} data-testid="transfer-item-name">
                    <FileNameDisplay text={transfer.meta.filename} />
                </span>
            </div>

            {!isUploadingFolder && (
                <div className="transfers-manager-list-item-size text-right text-ellipsis" title={`${percentageDone}%`}>
                    {(isProgress || isPaused) && progress > 0 && (
                        <span className="hidden lg:inline">{shortHumanSize(progress)} / </span>
                    )}
                    {fileSize !== undefined
                        ? shortHumanSize(fileSize)
                        : isProgress && <Loader className="inline" size="small" />}
                </div>
            )}

            <div className="transfers-manager-list-item-status flex flex-nowrap items-center justify-end text-ellipsis">
                <TransferStateIndicator transfer={transfer} type={type} speed={speed} />
            </div>

            <TransferControls transfer={transfer} type={type} />

            <ProgressBar
                status={getProgressBarStatus(transfer.state)}
                aria-describedby={transfer.id}
                value={isCanceled ? 0 : progress}
                max={progressLimit}
            />
        </div>
    );
};

export default Transfer;
