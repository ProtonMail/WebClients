import type { WorkerMessage, WorkerResponse } from './recordingWorkerTypes';
import { MessageType, WorkerResponseType } from './recordingWorkerTypes';

interface FileSystemSyncAccessHandle {
    write(buffer: ArrayBuffer | ArrayBufferView, options?: { at?: number }): number;
    read(buffer: ArrayBuffer | ArrayBufferView, options?: { at?: number }): number;
    flush(): void;
    close(): void;
    getSize(): number;
    truncate(newSize: number): void;
}

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

    async closeHandles(): Promise<string> {
        if (this.writable) {
            await this.writable.close();
            this.writable = null;
        } else if (this.syncAccessHandle) {
            this.syncAccessHandle.flush();
            this.syncAccessHandle.close();
            this.syncAccessHandle = null;
        }

        return this.fileName;
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
            // eslint-disable-next-line no-console
            console.error('[Worker] Error closing sync handle:', err);
        }
    }
}

const storage = new OPFSWorkerStorage();

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
    const { type, id, data } = event.data;

    try {
        switch (type) {
            case MessageType.INIT: {
                const { fileExtension } = data;
                await storage.init(fileExtension);
                const response: WorkerResponse = { type: WorkerResponseType.SUCCESS, id };
                self.postMessage(response);
                break;
            }

            case MessageType.ADD_CHUNK: {
                const { chunkBuffer } = data;
                await storage.addChunk(chunkBuffer);
                const response: WorkerResponse = { type: WorkerResponseType.SUCCESS, id };
                self.postMessage(response);
                break;
            }

            case MessageType.CLOSE_HANDLES: {
                const fileName = await storage.closeHandles();
                const response: WorkerResponse = {
                    type: WorkerResponseType.SUCCESS,
                    id,
                    data: { fileName },
                };
                self.postMessage(response);
                break;
            }

            case MessageType.CLEAR: {
                await storage.clear();
                const response: WorkerResponse = { type: WorkerResponseType.SUCCESS, id };
                self.postMessage(response);
                break;
            }

            case MessageType.CLOSE: {
                storage.close();
                const response: WorkerResponse = { type: WorkerResponseType.SUCCESS, id };
                self.postMessage(response);
                break;
            }

            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        const response: WorkerResponse = {
            type: WorkerResponseType.ERROR,
            id,
            error: error instanceof Error ? error.message : String(error),
        };
        self.postMessage(response);
    }
};
