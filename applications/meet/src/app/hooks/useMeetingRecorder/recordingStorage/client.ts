import type { OpfsRecording } from '@proton/meet/store/slices/recordingsSlice';
import { isFirefox } from '@proton/shared/lib/helpers/browser';

import { forwardWorkerLog } from '../workerLogger';
import { getOpfsRecording } from './recordingFiles';
import {
    type FinalizeResponseData,
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

// Main-thread wrapper around the OPFS recording worker.
// Use `createRecordingStorageClient` to get an initialized instance.
export class RecordingStorageClient {
    private worker: Worker | null = null;
    private messageId = 0;
    private pendingMessages: Map<string, PendingMessage> = new Map();
    private pendingChunkWrites: Set<Promise<void>> = new Set();
    private fileExtension: string;
    private userId: string;
    private onStorageFull?: () => void;

    constructor(fileExtension: string, userId: string, onStorageFull?: () => void) {
        this.fileExtension = fileExtension;
        this.userId = userId;
        this.onStorageFull = onStorageFull;
    }

    async init(): Promise<void> {
        this.worker = new Worker(new URL('./worker/worker.ts', import.meta.url), {
            type: 'module',
        });

        this.worker.onmessage = (event: MessageEvent<StorageWorkerResponse>) => {
            if (forwardWorkerLog(event.data)) {
                return;
            }

            const response = event.data;

            if (response.type === StorageWorkerResponseType.STORAGE_FULL) {
                this.onStorageFull?.();
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

        await this.send({
            type: StorageMessageType.INIT,
            data: { fileExtension: this.fileExtension, userId: this.userId },
        });
    }

    // `position` is set by the WebCodecs path (mediabunny gives an explicit byte
    // offset per chunk); the MediaRecorder path omits it and the worker appends.
    async addChunk(chunk: Blob | Uint8Array<ArrayBuffer>, position?: number): Promise<void> {
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
            await this.send({ type: StorageMessageType.ADD_CHUNK, data: { chunkBuffer, position } }, [chunkBuffer]);
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

    // Closes write handles and returns the recording's files in order.
    // Today there is always one file; the artifact is plural to keep
    // multi-file rotation forward-compatible.
    async finalize(): Promise<OpfsRecording | null> {
        await this.drainPendingChunkWrites();
        const { fileNames } = (await this.send({ type: StorageMessageType.FINALIZE })) as FinalizeResponseData;

        if (isFirefox()) {
            // Firefox needs the worker to fully release the file handles
            // before the main thread can read them back from OPFS.
            this.terminate();
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        return fileNames[0] ? getOpfsRecording(this.userId, fileNames[0]) : null;
    }

    async clear(): Promise<void> {
        await this.drainPendingChunkWrites();
        await this.send({ type: StorageMessageType.CLEAR });
    }

    close(): void {
        if (!this.worker) {
            return;
        }

        try {
            const message: StorageWorkerMessage = {
                type: StorageMessageType.CLOSE,
                id: this.generateMessageId(),
            };
            this.worker.postMessage(message);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[MeetingRecorder/recordingWorker] Error sending close message:', err);
        }
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

export const createRecordingStorageClient = async (
    fileExtension: string,
    userId: string,
    onStorageFull?: () => void
): Promise<RecordingStorageClient> => {
    const client = new RecordingStorageClient(fileExtension, userId, onStorageFull);
    await client.init();
    return client;
};
