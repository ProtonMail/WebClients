import React from 'react';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { classnames, Loader, FileIcon } from 'react-components';
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
} from '../../utils/transfer';
import { TransferType, TransferProps } from './interfaces';

type Props<T extends TransferType> = React.HTMLAttributes<HTMLDivElement> &
    TransferProps<T> & {
        stats: {
            progress: number;
            speed: number;
        };
    };

const Transfer = <T extends TransferType>({ stats, transfer, type, className, ...rest }: Props<T>) => {
    const isInitializing = isTransferInitializing(transfer);
    const isProgress = isTransferProgress(transfer);
    const isPaused = isTransferPaused(transfer);
    const isCanceled = isTransferCanceled(transfer);
    const isDone = isTransferDone(transfer);

    const fileSize = transfer.meta.size;
    const progressLimit = fileSize || 1;
    const percentageDone = Math.floor(100 * (stats.progress / progressLimit));

    // If file size is 0 when finished, progress is 1/1, so that the bar is complete
    const progress = !fileSize && isDone ? 1 : stats.progress;
    const speed = humanSize(stats.speed);

    return (
        <div
            className={classnames([
                'pd-transfers-listItem pb1 pt1 pl1 pr1',
                isCanceled && 'pd-transfers-listItem--canceled',
                className,
            ])}
            {...rest}
        >
            <div className="pd-transfers-listItem-name flex flex-nowrap flex-items-center ellipsis">
                <span className="pd-transfers-listItem-icon flex flex-item-noshrink">
                    {isInitializing ? (
                        <Loader className="mr0-5" size="small" />
                    ) : (
                        <FileIcon mimeType={transfer.meta.mimeType} />
                    )}
                </span>
                <span
                    className={classnames(['ellipsis', isInitializing && 'opacity-50'])}
                    title={transfer.meta.filename}
                >
                    <span className="pre">{transfer.meta.filename}</span>
                </span>
            </div>

            <div className="pd-transfers-listItem-size alignright ellipsis" title={`${percentageDone}%`}>
                {(isProgress || isPaused) && <span className="notablet nomobile">{humanSize(progress)} / </span>}
                {fileSize !== undefined && humanSize(fileSize)}
            </div>

            <div className="pd-transfers-listItem-status flex flex-nowrap flex-items-center flex-justify-end ellipsis">
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
