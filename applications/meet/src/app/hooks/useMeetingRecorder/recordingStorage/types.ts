export enum StorageMessageType {
    INIT = 'init',
    ADD_CHUNK = 'addChunk',
    FINALIZE = 'finalize',
    CLEAR = 'clear',
    CLOSE = 'close',
}

export type StorageWorkerMessage =
    | { type: StorageMessageType.INIT; id: string; data: { fileExtension: string; userId: string } }
    | { type: StorageMessageType.ADD_CHUNK; id: string; data: { chunkBuffer: ArrayBuffer; position?: number } }
    | { type: StorageMessageType.FINALIZE; id: string }
    | { type: StorageMessageType.CLEAR; id: string }
    | { type: StorageMessageType.CLOSE; id: string };

export enum StorageWorkerResponseType {
    SUCCESS = 'success',
    ERROR = 'error',
    STORAGE_FULL = 'storageFull',
}

export type FinalizeResponseData = { fileNames: string[] };

export type StorageWorkerResponse =
    | { type: StorageWorkerResponseType.SUCCESS; id: string; data?: FinalizeResponseData }
    | { type: StorageWorkerResponseType.ERROR; id: string; error: string }
    | { type: StorageWorkerResponseType.STORAGE_FULL };
