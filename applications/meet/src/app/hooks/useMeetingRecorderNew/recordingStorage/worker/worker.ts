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

    async init(fileExtension: string): Promise<void> {
        this.fileExtension = fileExtension;
        this.fileName = `recording-${Date.now()}.${this.fileExtension}`;

        this.root = await navigator.storage.getDirectory();

        this.fileHandle = await this.root.getFileHandle(this.fileName, {
            create: true,
        });

        if (typeof this.fileHandle.createWritable === 'function') {
            this.writable = await this.fileHandle.createWritable();
        } else if (
            typeof (this.fileHandle as unknown as { createSyncAccessHandle: () => Promise<FileSystemSyncAccessHandle> })
                .createSyncAccessHandle === 'function'
        ) {
            this.syncAccessHandle = await (
                this.fileHandle as unknown as { createSyncAccessHandle: () => Promise<FileSystemSyncAccessHandle> }
            ).createSyncAccessHandle();
            this.filePosition = 0;
        } else {
            throw new Error('No supported OPFS write API available in worker');
        }
    }

    async addChunk(chunkBuffer: ArrayBuffer): Promise<void> {
        if (this.syncAccessHandle) {
            const bytesWritten = this.syncAccessHandle.write(chunkBuffer, { at: this.filePosition });
            this.filePosition += bytesWritten;
            this.syncAccessHandle.flush();
        } else if (this.writable) {
            await this.writable.write(chunkBuffer);
        } else {
            throw new Error('No writable stream or sync handle available');
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
                await storage.init(message.data.fileExtension);
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
