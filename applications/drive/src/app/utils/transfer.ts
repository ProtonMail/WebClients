import { TransferState, TransferMeta, Transfer, TransferSummary } from '../interfaces/transfer';
import { LinkMeta } from '../interfaces/link';
import { FileBrowserItem } from '../components/FileBrowser/interfaces';
import { ProgressBarStatus } from '../components/TransferManager/ProgressBar';
import { TransfersStats } from '../components/TransferManager/interfaces';

export const isTransferFinished = ({ state }: { state: TransferState }) =>
    [TransferState.Error, TransferState.Canceled, TransferState.Done].includes(state);

export const isTransferActive = ({ state }: { state: TransferState }) =>
    [TransferState.Pending, TransferState.Progress, TransferState.Initializing, TransferState.Finalizing].includes(
        state
    );

export const isTransferFailed = ({ state }: { state: TransferState }) =>
    [TransferState.Error, TransferState.Canceled].includes(state);

export const isTransferDone = ({ state }: { state: TransferState }) => state === TransferState.Done;

export const isTransferError = ({ state }: { state: TransferState }) => state === TransferState.Error;

export const isTransferCanceled = ({ state }: { state: TransferState }) => state === TransferState.Canceled;

export const isTransferProgress = ({ state }: { state: TransferState }) => state === TransferState.Progress;

export const isTransferInitializing = ({ state }: { state: TransferState }) => state === TransferState.Initializing;

export const isTransferPaused = ({ state }: { state: TransferState }) => state === TransferState.Paused;

export const isTransferPending = ({ state }: { state: TransferState }) => state === TransferState.Pending;

export const isTransferFinalizing = ({ state }: { state: TransferState }) => state === TransferState.Finalizing;

export const isTransferCancelError = (error: Error) => error.name === 'TransferCancel' || error.name === 'AbortError';

export const getMetaForTransfer = (item: FileBrowserItem | LinkMeta): TransferMeta => {
    return {
        filename: item.Name,
        mimeType: item.MIMEType,
        size: item.Size,
    };
};

export const getProgressBarStatus = (transferState: TransferState): ProgressBarStatus => {
    return (
        (
            {
                [TransferState.Done]: ProgressBarStatus.Success,
                [TransferState.Canceled]: ProgressBarStatus.Disabled,
                [TransferState.Error]: ProgressBarStatus.Error,
            } as any
        )[transferState] || ProgressBarStatus.Running
    );
};

export const calculateProgress = (latestStats: TransfersStats, transfers: Transfer[]) => {
    /**
     * Returns a transfer summary while compensating for empty files.
     * We consider empty files as 1 byte to avoid constant 0% progress
     * along the trasfer with multiple empty files.
     */
    function transferSummaryReducer(acc: TransferSummary, transfer: Transfer): TransferSummary {
        const emptyFileCompensationInBytes = 1;
        if (transfer.meta.size === 0) {
            if (transfer.state === TransferState.Done) {
                acc.progress += emptyFileCompensationInBytes;
            }
            acc.size += emptyFileCompensationInBytes;
        } else {
            acc.size += transfer.meta.size || 0;
            acc.progress += latestStats.stats[transfer.id]?.progress || 0;
        }

        return acc;
    }

    const { progress, size } = transfers.reduce(transferSummaryReducer, { progress: 0, size: 0 });

    return Math.floor(100 * (progress / (size || 1)));
};
