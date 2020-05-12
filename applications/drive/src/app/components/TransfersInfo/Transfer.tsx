import React from 'react';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { c } from 'ttag';
import { Icon, classnames } from 'react-components';
import { Download } from '../downloads/DownloadProvider';
import { Upload } from '../uploads/UploadProvider';
import ProgressBar, { ProgressBarStatus } from './ProgressBar';
import { TransferState } from '../../interfaces/transfer';
import TransferStateIndicator from './TransferStateIndicator';
import TransferControls from './TransferControls';
import FileIcon from '../FileIcon';

export enum TransferType {
    Download = 'download',
    Upload = 'upload'
}

interface DownloadProps {
    transfer: Download;
    type: TransferType.Download;
}

interface UploadProps {
    transfer: Upload;
    type: TransferType.Upload;
}

export interface TransferStats {
    progress: number;
    speed: number;
}

type Props = (DownloadProps | UploadProps) & {
    stats?: TransferStats;
};

const Transfer = ({ transfer, type, stats = { progress: 0, speed: 0 } }: Props) => {
    const isProgress = transfer.state === TransferState.Progress;
    const isError = transfer.state === TransferState.Canceled || transfer.state === TransferState.Error;
    const isDone = transfer.state === TransferState.Done;
    const isInitializing = transfer.state === TransferState.Initializing;
    const isFinished = isError || isDone;

    const fileSize = transfer.meta.size;
    const progressLimit = fileSize || 1;
    const percentageDone = Math.floor(100 * (stats.progress / progressLimit));

    // If file size is 0 when finished, progress is 1/1, so that the bar is complete
    const progress = !fileSize && isFinished ? 1 : stats.progress;
    const speed = humanSize(stats.speed);
    const hasControls = type === TransferType.Download || isError || isDone;

    return (
        <div
            className={classnames([
                'pd-transfers-listItem pb1 pt1 ml1 mr1',
                hasControls && 'pd-transfers--hasControls'
            ])}
        >
            <div className="flex flex-nowrap flex-spacebetween flex-items-center">
                <Icon
                    name={type === TransferType.Download ? 'download' : 'upload'}
                    className="pd-transfers-listItemTypeIcon mr0-5 flex-item-noshrink"
                    size={24}
                />

                <FileIcon mimeType={transfer.meta.mimeType} aria-busy={isInitializing} />

                <div className="flex flex-item-fluid">
                    <span
                        className={classnames(['ellipsis', isInitializing && 'opacity-50'])}
                        title={transfer.meta.filename}
                    >
                        {transfer.meta.filename}
                    </span>
                </div>

                <div className="pd-transfers-listItemStats flex-item-noshrink flex flex-spacebetween flex-nowrap">
                    <span className="pd-transfers-listItemStat alignright notinymobile">
                        {fileSize !== undefined && humanSize(fileSize)}
                    </span>
                    {isProgress && (
                        <span className="pd-transfers-listItemStat alignright notinymobile">{c('Info')
                            .t`${speed}/s`}</span>
                    )}
                    {hasControls && <TransferControls transfer={transfer} type={type} />}
                    <TransferStateIndicator transfer={transfer} percentageDone={percentageDone} />
                </div>
            </div>
            <ProgressBar
                status={isError ? ProgressBarStatus.Error : ProgressBarStatus.Success}
                aria-describedby={transfer.id}
                value={progress}
                max={progressLimit}
            />
        </div>
    );
};

export default Transfer;
