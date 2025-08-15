import type { ProcessResult } from './raw';

export interface RawProcessorWorkerInterface {
    initialize(): Promise<void>;
    extractThumbnail(rawData: Uint8Array<ArrayBuffer>, fileName?: string): Promise<ProcessResult>;
    terminate(): void;
}

type WorkerResponse = {
    type: 'initialized' | 'thumbnailExtracted' | 'error';
    id: number;
    result?: ProcessResult;
    error?: string;
};

/**
 * Checks if a file is a CR3 file by examining its header
 * @param data The file data
 * @param fileName Optional filename to use (helps with identifying the file format)
 * @returns True if it's a CR3 file, false otherwise
 */
const isCR3File = (data: Uint8Array<ArrayBuffer>, fileName: string = '') => {
    if (data.length < 12) {
        return false;
    }
    // Rely on filename if it exists
    if (fileName) {
        if (fileName.toLowerCase().endsWith('.cr3')) {
            return true;
        }
        return false;
    }
    // Check for CR3 signature: ftypcrx or ftypheix
    const signature1 = String.fromCharCode(...data.slice(4, 12));
    return signature1 === 'ftypcrx ' || signature1 === 'ftypheix';
};

/**
 * Creates a RawProcessor instance wrapped in a Web Worker for background processing
 * @returns Promise resolving to a worker interface
 */
export async function createWorker(rawData: Uint8Array<ArrayBuffer>, fileName?: string): Promise<RawProcessorWorkerInterface> {
    const worker = isCR3File(rawData, fileName)
        ? new Worker(/* webpackChunkName: "proton-cr3-images" */ new URL('./worker-cr3', import.meta.url))
        : new Worker(/* webpackChunkName: "proton-raw-images" */ new URL('./worker-dcraw', import.meta.url));

    let nextMessageId = 1;

    const pendingPromises: Map<
        number,
        {
            resolve: (value: any) => void;
            reject: (reason: any) => void;
        }
    > = new Map();

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, id, result, error } = event.data;
        const promise = pendingPromises.get(id);

        if (!promise) {
            console.warn(`Received response for unknown message ID: ${id}`);
            return;
        }

        pendingPromises.delete(id);

        if (type === 'error') {
            promise.reject(new Error(error));
        } else {
            promise.resolve(result);
        }
    };

    const sendMessage = <T>(type: string, data?: any, transferables: Transferable[] = []): Promise<T> => {
        const id = nextMessageId++;

        return new Promise<T>((resolve, reject) => {
            pendingPromises.set(id, { resolve, reject });

            worker.postMessage(
                {
                    type,
                    id,
                    ...data,
                },
                transferables
            );
        });
    };

    return {
        initialize: () => sendMessage('initialize', {}),

        extractThumbnail: (rawData: Uint8Array<ArrayBuffer>, fileName?: string) => {
            return sendMessage<ProcessResult>('extractThumbnail', { data: rawData, fileName }, [rawData.buffer]);
        },

        terminate: () => worker.terminate(),
    };
}
