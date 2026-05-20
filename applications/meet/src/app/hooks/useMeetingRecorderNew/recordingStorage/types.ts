export enum StorageMessageType {
    INIT = 'init',
    ADD_CHUNK = 'addChunk',
    FINALIZE = 'finalize',
    CLEAR = 'clear',
    CLOSE = 'close',
}

export type StorageWorkerMessage =
    | { type: StorageMessageType.INIT; id: string; data: { fileExtension: string } }
    | { type: StorageMessageType.ADD_CHUNK; id: string; data: { chunkBuffer: ArrayBuffer } }
    | { type: StorageMessageType.FINALIZE; id: string }
    | { type: StorageMessageType.CLEAR; id: string }
    | { type: StorageMessageType.CLOSE; id: string };

export enum StorageWorkerResponseType {
    SUCCESS = 'success',
    ERROR = 'error',
}

export type FinalizeResponseData = { fileNames: string[] };

export type StorageWorkerResponse =
    | { type: StorageWorkerResponseType.SUCCESS; id: string; data?: FinalizeResponseData }
    | { type: StorageWorkerResponseType.ERROR; id: string; error: string };

// A finalized recording. Today the worker writes a single file per session,
// so `files` always has length 1. The shape is plural to make it easy to
// migrate to a multi-file strategy (rotated chunks, partial recovery from a
// previous tab crash via a manifest) without breaking consumers: callers
// concatenate with `new Blob(artifact.files, { type: artifact.mimeType })`.
export type RecordingArtifact = {
    files: File[];
    mimeType: string;
};
