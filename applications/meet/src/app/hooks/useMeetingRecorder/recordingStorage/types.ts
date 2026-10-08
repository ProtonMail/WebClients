import type { SessionKey } from '@protontech/crypto';

export enum StorageMessageType {
    INIT = 'init',
    ADD_CHUNK = 'addChunk',
    FINALIZE = 'finalize',
    CLEAR = 'clear',
}

export interface RecordingEncryption {
    encryptedSessionKey: Uint8Array<ArrayBuffer>;
    sessionKey: SessionKey;
}

export type StorageWorkerMessage =
    | {
          type: StorageMessageType.INIT;
          id: string;
          data: {
              fileExtension: string;
              folder: string;
              encryption?: RecordingEncryption;
          };
      }
    | { type: StorageMessageType.ADD_CHUNK; id: string; data: { chunkBuffer: ArrayBuffer } }
    | { type: StorageMessageType.FINALIZE; id: string }
    | { type: StorageMessageType.CLEAR; id: string };

export enum StorageWorkerResponseType {
    SUCCESS = 'success',
    ERROR = 'error',
    STORAGE_FULL = 'storageFull',
    WRITE_ERROR = 'writeError',
}

// `fileName` is null when no recorded data ever reached the disk, in which case the
// worker removes the file it created so it does not surface as an empty recording.
export type FinalizeResponseData = { fileName: string | null };

export type StorageWorkerResponse =
    | { type: StorageWorkerResponseType.SUCCESS; id: string; data?: FinalizeResponseData }
    | { type: StorageWorkerResponseType.ERROR; id: string; error: string }
    | { type: StorageWorkerResponseType.STORAGE_FULL; hasWrittenData: boolean }
    | { type: StorageWorkerResponseType.WRITE_ERROR; error: string; hasWrittenData: boolean };
