import { ProgressBarStatus } from '../components/TransferManager/ProgressBar';
import type { Transfer, TransferSummary, TransfersStats } from '../components/TransferManager/transfer';
import { TransferState } from '../components/TransferManager/transfer';

export class TransferCancel extends Error {
    constructor(options: { id: string } | { message: string }) {
        super('id' in options ? `Transfer ${options.id} canceled` : options.message);
        this.name = 'TransferCancel';
    }
}

export const isTransferFinished = ({ state }: { state: TransferState }) =>
    [TransferState.Error, TransferState.Canceled, TransferState.Skipped, TransferState.Done].includes(state);

export const isTransferActive = ({ state }: { state: TransferState }) =>
    [
        TransferState.Pending,
        TransferState.Initializing,
        TransferState.Conflict,
        TransferState.SignatureIssue,
        TransferState.Progress,
        TransferState.Finalizing,
    ].includes(state);

export const isTransferFailed = ({ state }: { state: TransferState }) =>
    [TransferState.Error, TransferState.Canceled].includes(state);

export const isTransferDone = ({ state }: { state: TransferState }) => state === TransferState.Done;

export const isTransferError = ({ state }: { state: TransferState }) =>
    state === TransferState.Error || state === TransferState.NetworkError;

export const isTransferCanceled = ({ state }: { state: TransferState }) => state === TransferState.Canceled;

export const isTransferSkipped = ({ state }: { state: TransferState }) => state === TransferState.Skipped;

export const isTransferConflict = ({ state }: { state: TransferState }) => state === TransferState.Conflict;

export const isTransferSignatureIssue = ({ state }: { state: TransferState }) => state === TransferState.SignatureIssue;

export const isTransferScanIssue = ({ state }: { state: TransferState }) => state === TransferState.ScanIssue;

export const isTransferProgress = ({ state }: { state: TransferState }) => state === TransferState.Progress;

export const isTransferInitializing = ({ state }: { state: TransferState }) => state === TransferState.Initializing;

export const isTransferManuallyPaused = ({ state }: { state: TransferState }) => state === TransferState.Paused;

export const isTransferPaused = ({ state }: { state: TransferState }) =>
    state === TransferState.Paused || state === TransferState.ScanIssue || state === TransferState.NetworkError;

export const isTransferPausedByConnection = ({ state }: { state: TransferState }) =>
    state === TransferState.NetworkError;

export const isTransferPending = ({ state }: { state: TransferState }) => state === TransferState.Pending;

export const isTransferFinalizing = ({ state }: { state: TransferState }) => state === TransferState.Finalizing;

export const isTransferOngoing = ({ state }: { state: TransferState }) => {
    return ![
        TransferState.Error,
        TransferState.Canceled,
        TransferState.Skipped,
        TransferState.Done,
        TransferState.Finalizing,
        TransferState.ScanIssue,
    ].includes(state);
};

const hasErrorName = (error: unknown): error is { name: unknown } =>
    typeof error === 'object' && error !== null && 'name' in error;

export const isTransferCancelError = (error: unknown): error is Error => {
    if (!hasErrorName(error) || typeof error.name !== 'string') {
        return false;
    }

    return error.name === 'TransferCancel' || error.name === 'AbortError';
};
export const isPhotosDisabledUploadError = (error: Error) => error.name === 'PhotosUploadDisabled';
export const isTransferRetry = (error: Error) => error.name === 'TransferRetry';
export const isTransferSkipError = (error: Error) => error.name === 'TransferSkipped';

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
