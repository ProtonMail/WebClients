import * as React from 'react';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { TransferType } from '@proton/shared/lib/interfaces/drive/transfer';
import { classnames, Loader, FileIcon, FileNameDisplay } from '@proton/components';
import ProgressBar from './ProgressBar';
import TransferStateIndicator from './TransferStateIndicator';
import TransferControls from './TransferControls';
import {
    isTransferInitializing,
    isTransferProgress,
    isTransferPaused,
    isTransferCanceled,
    isTransferDone,
    getProgressBarStatus,
    isTransferPending,
} from '../../utils/transfer';
import { TransferProps } from './interfaces';

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
    const isDone = isTransferDone(transfer);

    const fileSize = transfer.meta.size;
    const progressLimit = fileSize || 1;
    const percentageDone = isDone ? 100 : Math.floor(100 * (stats.progress / progressLimit));

    const progress = isDone ? progressLimit : stats.progress;
    const speed = humanSize(stats.speed);

    const isUploadingFolder = type === TransferType.Upload && transfer.meta.mimeType === 'Folder';

    return (
        <div
            className={classnames([
                'transfers-manager-list-item pb1 pt1 pl1 pr1',
                isCanceled && 'transfers-manager-list-item--canceled',
                className,
            ])}
            {...rest}
        >
            <div className="transfers-manager-list-item-name flex flex-nowrap flex-align-items-center text-ellipsis">
                <span className="transfers-manager-list-item-icon flex flex-item-noshrink mr0-5">
                    {isInitializing ? <Loader size="small" /> : <FileIcon mimeType={transfer.meta.mimeType} />}
                </span>
                <span className={classnames(['flex', isNameUnresolved && 'color-weak'])}>
                    <FileNameDisplay text={transfer.meta.filename} />
                </span>
            </div>

            {!isUploadingFolder && (
                <div className="transfers-manager-list-item-size text-right text-ellipsis" title={`${percentageDone}%`}>
                    {(isProgress || isPaused) && <span className="no-tablet no-mobile">{humanSize(progress)} / </span>}
                    {fileSize !== undefined
                        ? humanSize(fileSize)
                        : isProgress && <Loader className="inline" size="small" />}
                </div>
            )}

            <div className="transfers-manager-list-item-status flex flex-nowrap flex-align-items-center flex-justify-end text-ellipsis">
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
