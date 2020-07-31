import { TransferState, TransferMeta } from '../interfaces/transfer';
import { LinkMeta } from '../interfaces/link';
import { FileBrowserItem } from '../components/FileBrowser/interfaces';

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
