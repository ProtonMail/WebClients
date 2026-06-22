import { createWorkerLogger } from '../../workerLogger';
import {
    StorageMessageType,
    type StorageWorkerMessage,
    type StorageWorkerResponse,
    StorageWorkerResponseType,
} from '../types';

const logger = createWorkerLogger('MeetingRecorder/recordingWorker');

const isQuotaExceededError = (error: unknown): boolean =>
    error instanceof DOMException && error.name === 'QuotaExceededError';

// Persists recorded chunks into a single OPFS file per session.
class OPFSWorkerStorage {
    private root: FileSystemDirectoryHandle | null = null;
    private fileHandle: FileSystemFileHandle | null = null;
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

        if (typeof this.fileHandle.createSyncAccessHandle !== 'function') {
            throw new Error('createSyncAccessHandle is not available in this worker');
        }

        this.syncAccessHandle = await this.fileHandle.createSyncAccessHandle();
        this.filePosition = 0;
    }

    async addChunk(chunkBuffer: ArrayBuffer): Promise<boolean> {
        if (this.full || !this.syncAccessHandle) {
            return false;
        }

        try {
            const bytesWritten = this.syncAccessHandle.write(chunkBuffer, { at: this.filePosition });
            this.filePosition += bytesWritten;
            this.syncAccessHandle.flush();
            return false;
        } catch (error) {
            if (isQuotaExceededError(error)) {
                this.full = true;
                return true;
            }
            throw error;
        }
    }

    // Closes the write handle so the consumer can read the file back.
    async finalize(): Promise<{ fileName: string }> {
        if (this.syncAccessHandle) {
            this.syncAccessHandle.flush();
            this.syncAccessHandle.close();
            this.syncAccessHandle = null;
        }

        return { fileName: this.fileName };
    }

    async clear(): Promise<void> {
        if (this.syncAccessHandle) {
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
                const becameFull = await storage.addChunk(message.data.chunkBuffer);
                if (becameFull) {
                    const notification: StorageWorkerResponse = { type: StorageWorkerResponseType.STORAGE_FULL };
                    self.postMessage(notification);
                }
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
