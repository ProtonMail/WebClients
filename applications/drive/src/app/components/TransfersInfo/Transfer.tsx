import React from 'react';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { classnames, Loader } from 'react-components';
import ProgressBar, { ProgressBarStatus } from './ProgressBar';
import { TransferState, Download, Upload } from '../../interfaces/transfer';
import TransferStateIndicator from './TransferStateIndicator';
import TransferControls from './TransferControls';
import FileIcon from '../FileIcon/FileIcon';
import {
    isTransferInitializing,
    isTransferProgress,
    isTransferPaused,
    isTransferCanceled,
    isTransferDone
} from '../../utils/transfer';

export enum TransferType {
    Download = 'download',
    Upload = 'upload'
}

export interface DownloadProps {
    transfer: Download;
    type: TransferType.Download;
}

export interface UploadProps {
    transfer: Upload;
    type: TransferType.Upload;
}

export interface TransferStats {
    state: TransferState;
    progress: number;
    speed: number;
}

type Props = (DownloadProps | UploadProps) & {
    stats: {
        progress: number;
        speed: number;
    };
};

const Transfer = ({ stats, ...props }: Props) => {
    const { transfer, type } = props;
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
                'pd-transfers-listItem pb1 pt1 ml1 mr1',
                isCanceled && 'pd-transfers-listItem--canceled'
            ])}
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
            <TransferControls {...props} />

            <ProgressBar
                status={
                    ({
                        [TransferState.Done]: ProgressBarStatus.Success,
                        [TransferState.Canceled]: ProgressBarStatus.Disabled,
                        [TransferState.Error]: ProgressBarStatus.Error
                    } as any)[transfer.state] || ProgressBarStatus.Running
                }
                aria-describedby={transfer.id}
                value={isCanceled ? 0 : progress}
                max={progressLimit}
            />
        </div>
    );
};

export default Transfer;
