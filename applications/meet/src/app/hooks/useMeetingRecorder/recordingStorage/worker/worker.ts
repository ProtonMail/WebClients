import { createWorkerLogger } from '../../workerLogger';
import {
    StorageMessageType,
    type StorageWorkerMessage,
    type StorageWorkerResponse,
    StorageWorkerResponseType,
} from '../types';

const logger = createWorkerLogger('MeetingRecorder/recordingWorker');

interface FileSystemSyncAccessHandle {
    write(buffer: ArrayBuffer | ArrayBufferView, options?: { at?: number }): number;
    read(buffer: ArrayBuffer | ArrayBufferView, options?: { at?: number }): number;
    flush(): void;
    close(): void;
    getSize(): number;
    truncate(newSize: number): void;
}

const isQuotaExceededError = (error: unknown): boolean =>
    error instanceof DOMException && error.name === 'QuotaExceededError';

// Persists recorded chunks into OPFS. Today this writes one file per session.
// When we add multi-file rotation + recovery, the public API stays the same:
// `finalize()` returns the ordered list of files for the session.
class OPFSWorkerStorage {
    private root: FileSystemDirectoryHandle | null = null;
    private fileHandle: FileSystemFileHandle | null = null;
    private writable: FileSystemWritableFileStream | null = null;
    private syncAccessHandle: FileSystemSyncAccessHandle | null = null;
    private filePosition = 0;
    private fileExtension: string = 'webm';
    private fileName: string = '';
    private full = false;

    async init(fileExtension: string, userId: string): Promise<void> {
        this.fileExtension = fileExtension;
        this.fileName = `recording-${Date.now()}.${this.fileExtension}`;

        const root = await navigator.storage.getDirectory();
        // Namespace recordings under a per-user subdirectory.
        this.root = await root.getDirectoryHandle(userId, { create: true });

        this.fileHandle = await this.root.getFileHandle(this.fileName, {
            create: true,
        });

        if (typeof this.fileHandle.createSyncAccessHandle === 'function') {
            this.syncAccessHandle = await this.fileHandle.createSyncAccessHandle();
            this.filePosition = 0;
        } else if (typeof this.fileHandle.createWritable === 'function') {
            this.writable = await this.fileHandle.createWritable();
        } else {
            throw new Error('No supported OPFS write API available in worker');
        }
    }

    async addChunk(chunkBuffer: ArrayBuffer, position?: number): Promise<boolean> {
        if (this.full) {
            return false;
        }

        try {
            if (this.syncAccessHandle) {
                const at = position ?? this.filePosition;
                const bytesWritten = this.syncAccessHandle.write(chunkBuffer, { at });
                this.filePosition = Math.max(this.filePosition, at + bytesWritten);
                this.syncAccessHandle.flush();
            } else if (this.writable) {
                if (position !== undefined) {
                    await this.writable.write({ type: 'write', position, data: chunkBuffer });
                } else {
                    await this.writable.write(chunkBuffer);
                }
            } else {
                throw new Error('No writable stream or sync handle available');
            }
            return false;
        } catch (error) {
            if (isQuotaExceededError(error)) {
                this.full = true;
                return true;
            }
            throw error;
        }
    }

    // Returns the names of the files that contain this recording, in order.
    // Closes any pending write handles so the consumer can read them back.
    async finalize(): Promise<{ fileNames: string[] }> {
        if (this.writable) {
            await this.writable.close();
            this.writable = null;
        } else if (this.syncAccessHandle) {
            this.syncAccessHandle.flush();
            this.syncAccessHandle.close();
            this.syncAccessHandle = null;
        }

        return { fileNames: [this.fileName] };
    }

    async clear(): Promise<void> {
        if (this.writable) {
            await this.writable.close();
            this.writable = null;
        } else if (this.syncAccessHandle) {
            this.syncAccessHandle.close();
            this.syncAccessHandle = null;
        }

        if (this.root && this.fileHandle) {
            await this.root.removeEntry(this.fileName);
            this.fileHandle = null;
        }
    }

    close(): void {
        try {
            if (this.syncAccessHandle) {
                this.syncAccessHandle.close();
                this.syncAccessHandle = null;
            }
        } catch (err) {
            logger.error('Error closing sync handle:', err);
        }
    }
}

const storage = new OPFSWorkerStorage();

self.onmessage = async (event: MessageEvent<StorageWorkerMessage>) => {
    const message = event.data;
    const { type, id } = message;

    try {
        switch (message.type) {
            case StorageMessageType.INIT: {
                await storage.init(message.data.fileExtension, message.data.userId);
                const response: StorageWorkerResponse = { type: StorageWorkerResponseType.SUCCESS, id };
                self.postMessage(response);
                break;
            }

            case StorageMessageType.ADD_CHUNK: {
                const becameFull = await storage.addChunk(message.data.chunkBuffer, message.data.position);
                if (becameFull) {
                    const notification: StorageWorkerResponse = { type: StorageWorkerResponseType.STORAGE_FULL };
                    self.postMessage(notification);
                }
                const response: StorageWorkerResponse = { type: StorageWorkerResponseType.SUCCESS, id };
                self.postMessage(response);
                break;
            }

            case StorageMessageType.FINALIZE: {
                const { fileNames } = await storage.finalize();
                const response: StorageWorkerResponse = {
                    type: StorageWorkerResponseType.SUCCESS,
                    id,
                    data: { fileNames },
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

            case StorageMessageType.CLOSE: {
                storage.close();
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
