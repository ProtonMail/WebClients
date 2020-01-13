import React from 'react';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { c } from 'ttag';
import { Download } from '../downloads/DownloadProvider';
import { Upload } from '../uploads/UploadProvider';
import ProgressBar, { ProgressBarStatus } from './ProgressBar';
import uploadSvg from './upload.svg';
import downloadSvg from './download.svg';
import { Icon } from 'react-components';
import { TransferState } from '../../interfaces/transfer';
import TransferStateIndicator from './TransferStateIndicator';

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
    const fileSize = 'Revision' in transfer.info ? transfer.info.Revision.Size : transfer.info.blob.size;
    const percentageDone = Math.floor(100 * (stats.progress / fileSize));

    const isProgress = transfer.state === TransferState.Progress;
    const isError = transfer.state === TransferState.Canceled || transfer.state === TransferState.Error;

    return (
        <div className="pd-transfers-listItem pb1 pt1 ml1 mr1">
            <div className="pd-transfers-listItemDetails">
                {type === TransferType.Download ? (
                    <img className="mr1 flex-item-noshrink" src={downloadSvg} alt={c('Info').t`Download`} />
                ) : (
                    <img className="mr1 flex-item-noshrink" src={uploadSvg} alt={c('Info').t`Upload`} />
                )}
                <Icon name="drafts" fill="altgrey" className="mr0-5 flex-item-noshrink" size={25} />
                <div className="pd-transfers-listItemName">
                    <span className="ellipsis" title={transfer.info.filename}>
                        {transfer.info.filename}
                    </span>
                </div>
                <div className="pd-transfers-listItemStats">
                    <span className="pd-transfers-listItemStat ml0-5">{humanSize(fileSize)}</span>
                    {isProgress && <span className="pd-transfers-listItemStat ml0-5">{humanSize(stats.speed)}/s</span>}
                    <TransferStateIndicator transfer={transfer} percentageDone={percentageDone} />
                </div>
            </div>
            <ProgressBar
                status={isError ? ProgressBarStatus.Error : ProgressBarStatus.Success}
                aria-describedby={transfer.id}
                value={stats.progress}
                max={fileSize}
            />
        </div>
    );
};

export default Transfer;
