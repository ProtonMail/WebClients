import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { Icon } from '@proton/components/index';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

import { BaseTransferStatus, DownloadStatus } from '../../../zustand/download/downloadManager.store';
import { UploadStatus } from '../../../zustand/upload/uploadQueue.store';
import type { TransferManagerEntry } from '../useTransferManagerState';

import './transferItem.scss';

type Props = {
    entry: TransferManagerEntry;
};

const getStatusLabel = (entry: TransferManagerEntry) =>
    ({
        [BaseTransferStatus.InProgress]: entry.type === 'download' ? c('Info').t`Downloading` : c('Info').t`Uploading`,
        [BaseTransferStatus.Pending]: c('Info').t`Waiting`,
        [BaseTransferStatus.Cancelled]: c('Info').t`Canceled`,
        [BaseTransferStatus.Failed]:
            entry.type === 'download' ? c('Info').t`Download Failed` : c('Info').t`Upload Failed`,
        [BaseTransferStatus.Finished]: entry.type === 'download' ? c('Info').t`Downloaded` : c('Info').t`Uploaded`,
        [BaseTransferStatus.Paused]: undefined,
        [BaseTransferStatus.PausedServer]: undefined,
        [UploadStatus.ConflictFound]: undefined,
        [DownloadStatus.Finalizing]: undefined,
    })[entry.status];

const getItemIconByStatus = (entry: TransferManagerEntry) => {
    switch (entry.status) {
        case BaseTransferStatus.Finished:
            return <Icon size={5} className="color-success" name="checkmark-circle-filled" />;
        case BaseTransferStatus.Pending:
            return <Icon size={5} name="clock" />;
        case BaseTransferStatus.InProgress:
            return <CircleLoader size="small" className="color-signal-info" />;
        case BaseTransferStatus.Cancelled:
            return <Icon size={5} className="color-weak" name="minus-circle-filled" />;
        case BaseTransferStatus.Failed:
            return <Icon size={5} className="color-danger" name="cross-circle-filled" />;
        default:
    }
};

export const TransferItem = ({ entry }: Props) => {
    const showLocationText = c('Action').t`Show location`;
    const transferredTotal = `${shortHumanSize(entry.transferredBytes)} / ${shortHumanSize(entry.storageSize)}`;

    return (
        <div className="tm-list-item bg-norm">
            <div className="tm-list-item__icon">{getItemIconByStatus(entry)}</div>
            <div className="tm-list-item__info">
                <span className="tm-list-item__title text-ellipsis text-nowrap text-rg">{entry.name}</span>
                <div className="tm-list-item__meta">
                    <span className="text-sm color-weak">{getStatusLabel(entry)}</span>
                    <span aria-hidden="true" className="text-sm text-weak">
                        &middot;
                    </span>
                    {entry.status === BaseTransferStatus.Finished && (
                        <span className="text-ellipsis text-nowrap text-sm color-weak">{showLocationText}</span>
                    )}
                    {entry.status !== BaseTransferStatus.Finished && (
                        <span className="text-ellipsis text-nowrap text-sm color-weak">{transferredTotal}</span>
                    )}
                </div>
            </div>
            <div className="tm-list-item__actions">
                {entry.status == BaseTransferStatus.Finished && (
                    <Button color="weak" shape="solid">
                        {c('Action').t`Share`}
                    </Button>
                )}
                {entry.status === BaseTransferStatus.InProgress && (
                    <Button color="weak" shape="outline">
                        {c('Action').t`Cancel`}
                    </Button>
                )}
            </div>
        </div>
    );
};
