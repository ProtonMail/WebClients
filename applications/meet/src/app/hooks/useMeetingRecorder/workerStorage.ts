import { isFirefox } from '@proton/shared/lib/helpers/browser';

import { MessageType, WorkerResponseType } from './recordingWorkerTypes';
import type { WorkerMessage, WorkerResponse } from './recordingWorkerTypes';

// Main-thread wrapper for the recording worker. Provides the same interface as OPFSRecordingStorage but uses a Web Worker

export class WorkerRecordingStorage {
    private worker: Worker | null = null;
    private messageId = 0;
    private pendingMessages = new Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>();
    private fileExtension: string;

    constructor(fileExtension: string = 'webm') {
        this.fileExtension = fileExtension;
    }

    async init(): Promise<void> {
        this.worker = new Worker(new URL('./recordingWorker.ts', import.meta.url), {
            type: 'module',
        });

        this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { type, id, data, error } = event.data;
            const pending = this.pendingMessages.get(id);

            if (!pending) {
                return;
            }

            this.pendingMessages.delete(id);

            if (type === WorkerResponseType.ERROR) {
                pending.reject(new Error(error || 'Unknown worker error'));
            } else {
                pending.resolve(data);
            }
        };

        this.worker.onerror = () => {
            for (const pending of this.pendingMessages.values()) {
                pending.reject(new Error('Worker error'));
            }
            this.pendingMessages.clear();
        };

        await this.sendMessage(MessageType.INIT, {
            fileExtension: this.fileExtension,
        });
    }

    async addChunk(chunk: Blob): Promise<void> {
        if (!this.worker) {
            throw new Error('Worker not initialized');
        }

        const chunkBuffer = await chunk.arrayBuffer();

        await this.sendMessage(MessageType.ADD_CHUNK, { chunkBuffer }, [chunkBuffer]);
    }

    async getFile(): Promise<File> {
        const result = await this.sendMessage(MessageType.CLOSE_HANDLES, {});
        const { fileName } = result;

        if (isFirefox()) {
            this.terminate();
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle(fileName);
        const file = await fileHandle.getFile();

        return file;
    }

    async clear(): Promise<void> {
        await this.sendMessage(MessageType.CLEAR, {});
    }

    close(): void {
        if (this.worker) {
            try {
                this.worker.postMessage({
                    type: MessageType.CLOSE,
                    id: this.generateMessageId(),
                    data: {},
                } as WorkerMessage);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('[WorkerStorage] Error sending close message:', err);
            }
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

    private sendMessage(type: WorkerMessage['type'], data: any, transfer?: Transferable[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error('Worker not initialized'));
                return;
            }

            const id = this.generateMessageId();
            this.pendingMessages.set(id, { resolve, reject });

            const message: WorkerMessage = { type, id, data };

            try {
                if (transfer && transfer.length > 0) {
                    this.worker.postMessage(message, transfer);
                } else {
                    this.worker.postMessage(message);
                }
            } catch (err) {
                this.pendingMessages.delete(id);
                reject(err);
            }
        });
    }
}
