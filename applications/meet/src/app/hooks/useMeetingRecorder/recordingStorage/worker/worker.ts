import { CryptoProxy, type SessionKey } from '@protontech/crypto';

import { createWorkerLogger } from '../../workerLogger';
import {
    type FinalizeResponseData,
    type RecordingEncryption,
    StorageMessageType,
    type StorageWorkerMessage,
    type StorageWorkerResponse,
    StorageWorkerResponseType,
} from '../types';

const logger = createWorkerLogger('MeetingRecorder/recordingWorker');

const isQuotaExceededError = (error: unknown): boolean =>
    error instanceof DOMException && error.name === 'QuotaExceededError';

const encryptRecordingStream = async (dataStream: ReadableStream<Uint8Array<ArrayBuffer>>, sessionKey: SessionKey) => {
    const { messageStream } = await CryptoProxy.encryptMessageStream({
        binaryDataStream: dataStream,
        sessionKey,
        format: 'binary',
    });
    return messageStream;
};

interface OPFSWorkerStorageOptions {
    onStorageFull: (hasWrittenData: boolean) => void;
    onWriteError: (error: unknown, hasWrittenData: boolean) => void;
}

// Persists recorded chunks into a single OPFS file per session.
class OPFSWorkerStorage {
    private onStorageFull: (hasWrittenData: boolean) => void;
    private onWriteError: (error: unknown, hasWrittenData: boolean) => void;
    private root: FileSystemDirectoryHandle | null = null;
    private fileHandle: FileSystemFileHandle | null = null;
    private syncAccessHandle: FileSystemSyncAccessHandle | null = null;
    private filePosition = 0;
    private fileExtension: string = 'webm';
    private fileName: string = '';
    private full = false;
    private hasWrittenData = false;
    private writerForDataStreamToEncrypt: WritableStreamDefaultWriter<Uint8Array<ArrayBuffer>> | null = null;
    private readerForEncryptionStreamToStore: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>> | null = null;
    private encryptionStreamReaderPromise: Promise<void> | null = null;

    constructor({ onStorageFull, onWriteError }: OPFSWorkerStorageOptions) {
        this.onStorageFull = onStorageFull;
        this.onWriteError = onWriteError;
    }

    async init(fileExtension: string, folder: string, encryption?: RecordingEncryption): Promise<void> {
        this.fileExtension = fileExtension;
        this.fileName = `recording-${Date.now()}.${this.fileExtension}`;

        if (encryption) {
            // import CryptoApi dynamically on init to make sure the code does not spill outside of the worker;
            // and so it's easier to catch any loading errors
            const { Api: CryptoApi } = await import('@protontech/crypto/proxy/endpoint/api.ts');
            CryptoApi.init({});
            CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
        }

        const root = await navigator.storage.getDirectory();
        // Namespace recordings under a per-user subdirectory.
        this.root = await root.getDirectoryHandle(folder, { create: true });

        this.fileHandle = await this.root.getFileHandle(this.fileName, {
            create: true,
        });

        if (typeof this.fileHandle.createSyncAccessHandle !== 'function') {
            throw new Error('createSyncAccessHandle is not available in this worker');
        }

        this.syncAccessHandle = await this.fileHandle.createSyncAccessHandle();
        this.filePosition = 0;

        // TransformStreams are supported wherever createSyncAccessHandle, so polyfilling not needed
        const { readable, writable } = new TransformStream<Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>>();
        this.writerForDataStreamToEncrypt = writable.getWriter();
        const streamToStore = encryption ? await encryptRecordingStream(readable, encryption.sessionKey) : readable;

        this.readerForEncryptionStreamToStore = streamToStore.getReader();
        this.encryptionStreamReaderPromise = (async () => {
            try {
                while (true) {
                    if (!this.readerForEncryptionStreamToStore) {
                        throw new Error('Reader is undefined');
                    }
                    const { done, value: encryptedChunk } = await this.readerForEncryptionStreamToStore.read();
                    if (done) {
                        // closing ops done in `finally`
                        break;
                    }

                    if (this.syncAccessHandle) {
                        if (this.filePosition === 0 && encryption) {
                            // prepend the session key
                            this.filePosition += this.syncAccessHandle.write(encryption.encryptedSessionKey, {
                                at: this.filePosition,
                            });
                        }
                        const bytesWritten = this.syncAccessHandle.write(encryptedChunk, { at: this.filePosition });
                        this.filePosition += bytesWritten;
                        this.syncAccessHandle.flush();
                        this.hasWrittenData = true;
                    } else {
                        throw new Error('No sync handle available');
                    }
                }
            } catch (error) {
                await this.readerForEncryptionStreamToStore?.cancel().catch(() => {});
                if (isQuotaExceededError(error)) {
                    this.full = true; // the main thread is expected to call `finalize()`
                    this.onStorageFull(this.hasWrittenData);
                } else {
                    logger.error('Error while writing the recording:', error);
                    this.onWriteError(error, this.hasWrittenData);
                }
            } finally {
                this.readerForEncryptionStreamToStore?.releaseLock();
                this.readerForEncryptionStreamToStore = null;
                this.syncAccessHandle?.close();
                this.syncAccessHandle = null;
            }
        })();
    }

    async addChunk(chunkBuffer: ArrayBuffer): Promise<void> {
        if (this.full) {
            return;
        }

        await this.writerForDataStreamToEncrypt?.write(new Uint8Array(chunkBuffer));
    }

    // Closes any pending write handles so the consumer can read them back.
    async finalize(): Promise<FinalizeResponseData> {
        // `close` will reject if readerForEncryptionStreamToStore was cancelled
        await this.writerForDataStreamToEncrypt?.close().catch(() => {});
        this.writerForDataStreamToEncrypt = null;
        await this.encryptionStreamReaderPromise;

        if (!this.hasWrittenData) {
            await this.removeFile();
            return { fileName: null };
        }

        return { fileName: this.fileName };
    }

    async clear(): Promise<void> {
        // `abort` rejects if the encryption stream reader was already cancelled
        await this.writerForDataStreamToEncrypt?.abort().catch(() => {});
        this.writerForDataStreamToEncrypt = null;
        await this.readerForEncryptionStreamToStore?.cancel().catch(() => {});
        this.readerForEncryptionStreamToStore = null;
        await this.encryptionStreamReaderPromise?.catch(() => {});

        await this.removeFile();
    }

    private async removeFile(): Promise<void> {
        if (this.syncAccessHandle) {
            this.syncAccessHandle.close();
            this.syncAccessHandle = null;
        }

        if (this.root && this.fileHandle) {
            await this.root.removeEntry(this.fileName);
            this.fileHandle = null;
        }
    }
}

const storage = new OPFSWorkerStorage({
    onStorageFull: (hasWrittenData) => {
        const notification: StorageWorkerResponse = { type: StorageWorkerResponseType.STORAGE_FULL, hasWrittenData };
        self.postMessage(notification);
    },
    onWriteError: (error, hasWrittenData) => {
        const notification: StorageWorkerResponse = {
            type: StorageWorkerResponseType.WRITE_ERROR,
            error: error instanceof Error ? error.message : String(error),
            hasWrittenData,
        };
        self.postMessage(notification);
    },
});

self.onmessage = async (event: MessageEvent<StorageWorkerMessage>) => {
    const message = event.data;
    const { type, id } = message;

    try {
        switch (message.type) {
            case StorageMessageType.INIT: {
                await storage.init(message.data.fileExtension, message.data.folder, message.data.encryption);
                const response: StorageWorkerResponse = { type: StorageWorkerResponseType.SUCCESS, id };
                self.postMessage(response);
                break;
            }

            case StorageMessageType.ADD_CHUNK: {
                await storage.addChunk(message.data.chunkBuffer);
                const response: StorageWorkerResponse = { type: StorageWorkerResponseType.SUCCESS, id };
                self.postMessage(response);
                break;
            }

            case StorageMessageType.FINALIZE: {
                const { fileName } = await storage.finalize();
                const response: StorageWorkerResponse = {
                    type: StorageWorkerResponseType.SUCCESS,
                    id,
                    data: { fileName },
                };
                self.postMessage(response);
                break;
            }

            case StorageMessageType.CLEAR: {
                await storage.clear();
                const response: StorageWorkerResponse = { type: StorageWorkerResponseType.SUCCESS, id };
                self.postMessage(response);
                break;
            }
        }
    } catch (error) {
        logger.error(`Error handling message "${type}":`, error);
        const response: StorageWorkerResponse = {
            type: StorageWorkerResponseType.ERROR,
            id,
            error: error instanceof Error ? error.message : String(error),
        };
        self.postMessage(response);
    }
};

export {};
