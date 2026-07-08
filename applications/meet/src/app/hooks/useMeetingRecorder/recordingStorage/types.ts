import type { SessionKey } from '@protontech/crypto';

export enum StorageMessageType {
    INIT = 'init',
    ADD_CHUNK = 'addChunk',
    FINALIZE = 'finalize',
    CLEAR = 'clear',
}

export type StorageWorkerMessage =
    | {
          type: StorageMessageType.INIT;
          id: string;
          data: {
              fileExtension: string;
              userId: string;
              encryptedSessionKey: Uint8Array<ArrayBuffer>;
              sessionKey: SessionKey;
          };
      }
    | { type: StorageMessageType.ADD_CHUNK; id: string; data: { chunkBuffer: ArrayBuffer } }
    | { type: StorageMessageType.FINALIZE; id: string }
    | { type: StorageMessageType.CLEAR; id: string };

export enum StorageWorkerResponseType {
    SUCCESS = 'success',
    ERROR = 'error',
    STORAGE_FULL = 'storageFull',
}

export type FinalizeResponseData = { fileName: string };

export type StorageWorkerResponse =
    | { type: StorageWorkerResponseType.SUCCESS; id: string; data?: FinalizeResponseData }
    | { type: StorageWorkerResponseType.ERROR; id: string; error: string }
    | { type: StorageWorkerResponseType.STORAGE_FULL };
