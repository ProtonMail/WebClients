import type { PublicKeyReference } from '@protontech/crypto';
import { CryptoProxy } from '@protontech/crypto';

import type { OpfsRecording } from '@proton/meet/store/slices/recordingsSlice';
import { isFirefox } from '@proton/shared/lib/helpers/browser';

import { forwardWorkerLog } from '../workerLogger';
import { getRecordingFolder } from './getRecordingFolder';
import { getOpfsRecording } from './recordingFiles';
import {
    type FinalizeResponseData,
    type RecordingEncryption,
    StorageMessageType,
    type StorageWorkerMessage,
    type StorageWorkerResponse,
    StorageWorkerResponseType,
} from './types';

interface PendingMessage {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
}

type StorageWorkerMessageInput = StorageWorkerMessage extends infer U
    ? U extends { id: string }
        ? Omit<U, 'id'>
        : U
    : never;

interface RecordingStorageClientOptions {
    fileExtension: string;
    userId: string;
    onStorageFull?: (hasWrittenData: boolean) => void;
    onWriteError?: (error: string, hasWrittenData: boolean) => void;
}

const createRecordingEncryption = async (encryptionKey: PublicKeyReference): Promise<RecordingEncryption> => {
    const aeadSessionKey = await CryptoProxy.generateSessionKey({
        config: {
            /**
             * An AEAD session key needs to be generated here, to make it possible to safely release
             * partially decrypted data, if the encrypted file is truncated (e.g. on max storage quota reached).
             * @dev this setting is not backwards compatible across clients, do not blindly use it elsewhere
             */
            aeadProtect: true,
        },
    });
    const encryptedSessionKey = await CryptoProxy.encryptSessionKey({
        ...aeadSessionKey,
        encryptionKeys: encryptionKey,
        format: 'binary',
    });

    return { sessionKey: aeadSessionKey, encryptedSessionKey };
};

// Main-thread wrapper around the OPFS recording worker.
// Use `createRecordingStorageClient` to get an initialized instance.
export class RecordingStorageClient {
    private worker: Worker | null = null;
    private messageId = 0;
    private pendingMessages: Map<string, PendingMessage> = new Map();
    private pendingChunkWrites: Set<Promise<void>> = new Set();
    private fileExtension: string;
    private userId: string;
    private folder: string = '';
    private onStorageFull?: (hasWrittenData: boolean) => void;
    private onWriteError?: (error: string, hasWrittenData: boolean) => void;
    private storageFull = false;

    constructor({ fileExtension, userId, onStorageFull, onWriteError }: RecordingStorageClientOptions) {
        this.fileExtension = fileExtension;
        this.userId = userId;
        this.onStorageFull = onStorageFull;
        this.onWriteError = onWriteError;
        this.storageFull = false;
    }

    async init(encryptionKey?: PublicKeyReference): Promise<void> {
        this.worker = new Worker(new URL('./worker/worker.ts', import.meta.url), {
            type: 'module',
        });

        this.worker.onmessage = (event: MessageEvent<StorageWorkerResponse>) => {
            if (forwardWorkerLog(event.data)) {
                return;
            }

            const response = event.data;

            if (response.type === StorageWorkerResponseType.STORAGE_FULL) {
                if (this.storageFull) {
                    return;
                }

                this.storageFull = true;
                this.onStorageFull?.(response.hasWrittenData);
                return;
            }

            if (response.type === StorageWorkerResponseType.WRITE_ERROR) {
                this.onWriteError?.(response.error, response.hasWrittenData);
                return;
            }

            const pending = this.pendingMessages.get(response.id);

            if (!pending) {
                return;
            }

            this.pendingMessages.delete(response.id);

            if (response.type === StorageWorkerResponseType.ERROR) {
                pending.reject(new Error(response.error || 'Unknown worker error'));
            } else {
                pending.resolve(response.data);
            }
        };

        this.worker.onerror = (event) => {
            // eslint-disable-next-line no-console
            console.error('[MeetingRecorder/recordingWorker] uncaught error in worker:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                pendingMessages: this.pendingMessages.size,
            });

            for (const pending of this.pendingMessages.values()) {
                pending.reject(new Error(event.message || 'Worker error'));
            }

            this.pendingMessages.clear();
        };

        this.folder = encryptionKey ? getRecordingFolder(this.userId) : this.userId;

        await this.send({
            type: StorageMessageType.INIT,
            data: {
                fileExtension: this.fileExtension,
                folder: this.folder,
                encryption: encryptionKey ? await createRecordingEncryption(encryptionKey) : undefined,
            },
        });
    }

    async addChunk(chunk: Blob | Uint8Array<ArrayBuffer>): Promise<void> {
        if (!this.worker) {
            throw new Error('Worker not initialized');
        }

        const getChunkBuffer = async () => {
            if (chunk instanceof Blob) {
                return chunk.arrayBuffer();
            }

            if (chunk.byteOffset === 0 && chunk.byteLength === chunk.buffer.byteLength) {
                return chunk.buffer;
            }

            return chunk.slice().buffer;
        };

        const writePromise = (async () => {
            const chunkBuffer = await getChunkBuffer();
            await this.send({ type: StorageMessageType.ADD_CHUNK, data: { chunkBuffer } }, [chunkBuffer]);
        })();

        this.pendingChunkWrites.add(writePromise);

        try {
            await writePromise;
        } finally {
            this.pendingChunkWrites.delete(writePromise);
        }
    }

    private async drainPendingChunkWrites(): Promise<void> {
        if (this.pendingChunkWrites.size === 0) {
            return;
        }
        await Promise.allSettled([...this.pendingChunkWrites]);
    }

    // Closes the write handle and returns the finalized recording.
    async finalize(): Promise<OpfsRecording | null> {
        await this.drainPendingChunkWrites();
        const { fileName } = (await this.send({ type: StorageMessageType.FINALIZE })) as FinalizeResponseData;

        if (!fileName) {
            return null;
        }

        if (isFirefox()) {
            // Firefox needs the worker to fully release the file handle
            // before the main thread can read it back from OPFS.
            this.terminate();
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        return getOpfsRecording(this.folder, fileName);
    }

    async clear(): Promise<void> {
        await this.drainPendingChunkWrites();
        await this.send({ type: StorageMessageType.CLEAR });
    }

    terminate(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }

        for (const pending of this.pendingMessages.values()) {
            pending.reject(new Error('Worker terminated'));
        }
        this.pendingMessages.clear();
    }

    private generateMessageId(): string {
        return `msg-${++this.messageId}`;
    }

    private send(message: StorageWorkerMessageInput, transfer?: Transferable[]): Promise<unknown> {
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error('Worker not initialized'));
                return;
            }

            const id = this.generateMessageId();
            this.pendingMessages.set(id, { resolve, reject });

            const fullMessage = { ...message, id } as StorageWorkerMessage;

            try {
                if (transfer && transfer.length > 0) {
                    this.worker.postMessage(fullMessage, transfer);
                } else {
                    this.worker.postMessage(fullMessage);
                }
            } catch (err) {
                this.pendingMessages.delete(id);
                reject(err as Error);
            }
        });
    }
}

export const createRecordingStorageClient = async ({
    encryptionKey,
    ...options
}: RecordingStorageClientOptions & { encryptionKey?: PublicKeyReference }): Promise<RecordingStorageClient> => {
    const client = new RecordingStorageClient(options);
    await client.init(encryptionKey);
    return client;
};
