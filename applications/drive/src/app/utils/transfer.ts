import { TransferState, TransferMeta, Transfer } from '../interfaces/transfer';
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

export const isTransferError = ({ state }: { state: TransferState }) =>
    state === TransferState.Error || state === TransferState.NetworkError;

export const isTransferCanceled = ({ state }: { state: TransferState }) => state === TransferState.Canceled;

export const isTransferProgress = ({ state }: { state: TransferState }) => state === TransferState.Progress;

export const isTransferInitializing = ({ state }: { state: TransferState }) => state === TransferState.Initializing;

export const isTransferManuallyPaused = ({ state }: { state: TransferState }) => state === TransferState.Paused;

export const isTransferPaused = ({ state }: { state: TransferState }) =>
    state === TransferState.Paused || state === TransferState.NetworkError;

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
    const result = transfers.reduce(
        (result, transfer) => {
            result.size += transfer.meta.size || 0;
            result.progress += latestStats.stats[transfer.id]?.progress || 0;
            return result;
        },
        { size: 0, progress: 0 }
    );

    return Math.floor(100 * (result.progress / (result.size || 1)));
};
