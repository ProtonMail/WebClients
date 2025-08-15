import { type ProcessResult, RawProcessor } from './raw';

type WorkerMessage = {
    type: 'initialize' | 'extractThumbnail';
    id: number;
    data?: Uint8Array<ArrayBuffer>;
    fileName?: string;
};

type WorkerResponse = {
    type: 'initialized' | 'thumbnailExtracted' | 'error';
    id: number;
    result?: ProcessResult;
    error?: string;
};

class RawProcessorWorker {
    private processor: RawProcessor;

    constructor() {
        this.processor = new RawProcessor();
        self.onmessage = this.handleMessage.bind(this);
    }

    private async handleMessage(event: MessageEvent<WorkerMessage>): Promise<void> {
        const { type, id, data, fileName } = event.data;

        try {
            switch (type) {
                case 'initialize':
                    await this.initialize();
                    this.sendResponse({
                        type: 'initialized',
                        id,
                    });
                    break;

                case 'extractThumbnail':
                    if (!data) {
                        throw new Error('No data provided for thumbnail extraction');
                    }

                    const result = await this.processor.extractThumbnail(data, fileName);

                    if (result) {
                        this.sendResponse(
                            {
                                type: 'thumbnailExtracted',
                                id,
                                result,
                            },
                            [result.buffer]
                        );
                    } else {
                        this.sendResponse({
                            type: 'thumbnailExtracted',
                            id,
                            result: null,
                        });
                    }
                    break;

                default:
                    throw new Error(`Unknown message type: ${type}`);
            }
        } catch (error) {
            console.error(`Error in worker (${type}):`, error);
            this.sendResponse({
                type: 'error',
                id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Send a response back to the main thread (window)
     */
    private sendResponse(response: WorkerResponse, transferables: Transferable[] = []): void {
        self.postMessage(response, { transfer: transferables });
    }

    /**
     * Initialize the worker and wait for the WASM module to load
     */
    private async initialize(): Promise<void> {
        await this.processor.waitForDCRawModuleLoaded();
    }
}

new RawProcessorWorker();
