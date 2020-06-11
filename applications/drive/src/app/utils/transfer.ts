import { TransferState } from '../interfaces/transfer';

export const isTransferFinished = ({ state }: { state: TransferState }) =>
    [TransferState.Error, TransferState.Canceled, TransferState.Done].includes(state);
export const isTransferActive = ({ state }: { state: TransferState }) =>
    [TransferState.Pending, TransferState.Progress, TransferState.Initializing].includes(state);
export const isTransferFailed = ({ state }: { state: TransferState }) =>
    [TransferState.Error, TransferState.Canceled].includes(state);
export const isTransferDone = ({ state }: { state: TransferState }) => state === TransferState.Done;
export const isTransferError = ({ state }: { state: TransferState }) => state === TransferState.Error;
export const isTransferCanceled = ({ state }: { state: TransferState }) => state === TransferState.Canceled;
export const isTransferProgress = ({ state }: { state: TransferState }) => state === TransferState.Progress;
export const isTransferInitializing = ({ state }: { state: TransferState }) => state === TransferState.Initializing;
export const isTransferPaused = ({ state }: { state: TransferState }) => state === TransferState.Paused;
export const isTransferPending = ({ state }: { state: TransferState }) => state === TransferState.Pending;
