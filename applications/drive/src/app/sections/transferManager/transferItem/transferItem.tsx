import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { Icon } from '@proton/components/index';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

import { BaseTransferStatus, DownloadStatus } from '../../../zustand/download/downloadManager.store';
import { UploadStatus } from '../../../zustand/upload/uploadQueue.store';
import { useTransferManagerActions } from '../useTransferManagerActions';
import type { TransferManagerEntry } from '../useTransferManagerState';

type Props = {
    entry: TransferManagerEntry;
    onShare: () => void;
};

const getStatusLabel = (entry: TransferManagerEntry): string | undefined => {
    const labels: Record<string, string | undefined> = {
        [BaseTransferStatus.InProgress]: entry.type === 'download' ? c('Info').t`Downloading` : c('Info').t`Uploading`,
        [BaseTransferStatus.Pending]: c('Info').t`Waiting`,
        [BaseTransferStatus.Cancelled]: c('Info').t`Canceled`,
        [BaseTransferStatus.Failed]:
            entry.type === 'download' ? c('Info').t`Download Failed` : c('Info').t`Upload Failed`,
        [BaseTransferStatus.Finished]: entry.type === 'download' ? c('Info').t`Downloaded` : c('Info').t`Uploaded`,
        [BaseTransferStatus.Paused]: undefined,
        [BaseTransferStatus.PausedServer]: undefined,
        [UploadStatus.ConflictFound]: undefined,
        [UploadStatus.ParentCancelled]: undefined,
        // TODO: Probably we do not want skipped but cancelled of the item. Makes more sense but need update on uploadManager
        [UploadStatus.Skipped]: c('Info').t`Skipped`,
        [DownloadStatus.Finalizing]: undefined,
    };
    return labels[entry.status];
};

const getItemIconByStatus = (entry: TransferManagerEntry) => {
    if (entry.status === BaseTransferStatus.Finished) {
        return <Icon size={5} className="color-success" name="checkmark-circle-filled" />;
    }
    if (entry.status === BaseTransferStatus.Pending) {
        return <Icon size={5} name="clock" />;
    }
    if (entry.status === BaseTransferStatus.InProgress) {
        return <CircleLoader size="small" className="color-signal-info" />;
    }
    if (entry.status === BaseTransferStatus.Cancelled) {
        return <Icon size={5} className="color-weak" name="minus-circle-filled" />;
    }
    if (entry.status === BaseTransferStatus.Failed) {
        return <Icon size={5} className="color-danger" name="cross-circle-filled" />;
    }
    return null;
};

export const TransferItem = ({ entry, onShare }: Props) => {
    // const showLocationText = c('Action').t`Show location`;
    const totalSize = entry.type === 'download' ? entry.storageSize : entry.clearTextSize;
    const transferredTotal = `${shortHumanSize(entry.transferredBytes)} / ${shortHumanSize(totalSize)}`;
    const { cancelTransfer, retryTransfer } = useTransferManagerActions();

    return (
        <div
            className="bg-norm flex w-full gap-1 items-center p-2 h-full min-h-custom"
            style={{ '--min-h-custom': '3.3rem' }}
            data-testid="transfer-item-row"
        >
            <div className="mr-1 w-custom flex justify-center" style={{ '--w-custom': '1.5rem' }}>
                {getItemIconByStatus(entry)}
            </div>
            <div className="flex-1 max-w-full text-ellipsis ">
                <span className="text-nowrap text-rg">{entry.name}</span>
                <div className="gap-1 flex">
                    <span className="text-sm color-weak">{getStatusLabel(entry)}</span>

                    {/* TBI for upload only */}
                    {/* {entry.status === BaseTransferStatus.Finished && (
                        <span className="text-ellipsis text-nowrap text-sm color-weak">{showLocationText}</span>
                    )} */}
                    {entry.status !== BaseTransferStatus.Finished && (
                        <>
                            <span aria-hidden="true" className="text-sm text-weak">
                                &middot;
                            </span>
                            <span className="text-ellipsis text-nowrap text-sm color-weak">{transferredTotal}</span>
                        </>
                    )}
                </div>
            </div>
            <div className="w-1/6">
                {entry.status == BaseTransferStatus.Finished && (
                    <Button color="weak" shape="solid" onClick={onShare}>
                        {c('Action').t`Share`}
                    </Button>
                )}
                {entry.status === BaseTransferStatus.InProgress && (
                    <Button
                        color="weak"
                        shape="outline"
                        onClick={() => cancelTransfer(entry)}
                        data-testid="drive-transfers-manager:item-controls-cancel"
                    >
                        {c('Action').t`Cancel`}
                    </Button>
                )}
                {(entry.status === BaseTransferStatus.Failed || entry.status === BaseTransferStatus.Cancelled) && (
                    <Button
                        color="weak"
                        shape="outline"
                        onClick={() => retryTransfer(entry)}
                        data-testid="drive-transfers-manager:item-controls-restart"
                    >
                        {c('Action').t`Retry`}
                    </Button>
                )}
            </div>
        </div>
    );
};
