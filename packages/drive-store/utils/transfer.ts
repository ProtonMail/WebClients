export const isTransferCancelError = (error: Error) => error.name === 'TransferCancel' || error.name === 'AbortError';
