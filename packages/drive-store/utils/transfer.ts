import { ProgressBarStatus } from '../components/TransferManager/ProgressBar';
import type { Transfer, TransferSummary, TransfersStats } from '../components/TransferManager/transfer';
import { TransferState } from '../components/TransferManager/transfer';

export const isTransferFailed = ({ state }: { state: TransferState }) =>
    [TransferState.Error, TransferState.Canceled].includes(state);

export const isTransferDone = ({ state }: { state: TransferState }) => state === TransferState.Done;

export const isTransferError = ({ state }: { state: TransferState }) =>
    state === TransferState.Error || state === TransferState.NetworkError;

export const isTransferCanceled = ({ state }: { state: TransferState }) => state === TransferState.Canceled;

export const isTransferSkipped = ({ state }: { state: TransferState }) => state === TransferState.Skipped;

export const isTransferPaused = ({ state }: { state: TransferState }) =>
    state === TransferState.Paused || state === TransferState.ScanIssue || state === TransferState.NetworkError;

export const isTransferFinalizing = ({ state }: { state: TransferState }) => state === TransferState.Finalizing;

export const isTransferCancelError = (error: Error) => error.name === 'TransferCancel' || error.name === 'AbortError';
export const isTransferRetry = (error: Error) => error.name === 'TransferRetry';

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

export const calculateProgress = (stats: TransfersStats, transfers: Transfer[]) => {
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
            acc.progress +=
                (transfer.state === TransferState.Done ? transfer.meta.size : stats[transfer.id]?.progress) || 0;
        }

        return acc;
    }

    const { progress, size } = transfers.reduce(transferSummaryReducer, { progress: 0, size: 0 });

    return Math.floor(100 * (progress / (size || 1)));
};
