import type { ProcessResult } from './raw';

export interface RawProcessorWorkerInterface {
    initialize(): Promise<void>;
    extractThumbnail(rawData: Uint8Array, fileName?: string): Promise<ProcessResult>;
    terminate(): void;
}

type WorkerResponse = {
    type: 'initialized' | 'thumbnailExtracted' | 'error';
    id: number;
    result?: ProcessResult;
    error?: string;
};

/**
 * Creates a RawProcessor instance wrapped in a Web Worker for background processing
 * @returns Promise resolving to a worker interface
 */
export async function createWorker(): Promise<RawProcessorWorkerInterface> {
    const worker = new Worker(/* webpackChunkName: "proton-raw-images" */ new URL('./worker', import.meta.url));

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

        extractThumbnail: (rawData: Uint8Array, fileName?: string) => {
            return sendMessage<ProcessResult>('extractThumbnail', { data: rawData, fileName }, [rawData.buffer]);
        },

        terminate: () => worker.terminate(),
    };
}
