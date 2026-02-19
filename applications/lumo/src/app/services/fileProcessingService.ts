import { ThumbnailType } from '@protontech/drive-sdk';

import { generateThumbnail } from '@proton/drive/modules/thumbnails/thumbnailGenerator';

import { getProcessingCategory } from '../util/filetypes';
import type { InternalImageResult } from './files/types';

export interface FileData {
    name: string;
    type: string;
    size: number;
    data: ArrayBuffer;
}

export interface FileProcessingRequest {
    id: string;
    file: FileData;
    isLumoPaid?: boolean; // User tier information for tiered processing limits
}

export interface TextProcessingResult {
    id: string;
    type: 'text';
    content: string;
    metadata?: {
        truncated?: boolean;
        rowCount?: { original: number; processed: number };
    };
}

export interface ImageProcessingResult {
    id: string;
    type: 'image';
    originalSize: number;
    hdImageSize: number;
    hdImage: Uint8Array<ArrayBuffer>;
    previewThumbnail?: Uint8Array<ArrayBuffer>;
}

export interface ProcessingError {
    id: string;
    type: 'error';
    message: string;
    unsupported?: boolean;
}

export type FileProcessingResponse = TextProcessingResult | ImageProcessingResult | ProcessingError;

async function reduceImageSize(
    fileData: FileData
): Promise<{ sdThumbnail?: Uint8Array<ArrayBuffer>; hdThumbnail?: Uint8Array<ArrayBuffer> }> {
    console.log(`[Image Processing] Reducing image size for ${fileData.name} using thumbnail generator`);

    // Convert ArrayBuffer to Blob for thumbnail generator
    const blob = new Blob([fileData.data], { type: fileData.type });

    // Generate thumbnails with debug mode enabled
    const { thumbnailsPromise } = generateThumbnail(blob, fileData.name, fileData.size, { debug: true });

    // Await the thumbnail generation result
    const result = await thumbnailsPromise;

    if (!result.ok) {
        throw new Error(`Thumbnail generation failed: ${result.error}`);
    }

    const thumbnailResult = result.result;

    if (!thumbnailResult?.thumbnails || thumbnailResult.thumbnails.length === 0) {
        throw new Error('No thumbnails were generated');
    }

    // Retrieve both sizes
    const hdThumbnail = thumbnailResult.thumbnails.find((t) => t.type === ThumbnailType.Type2)?.thumbnail;
    const sdThumbnail = thumbnailResult.thumbnails.find((t) => t.type === ThumbnailType.Type1)?.thumbnail;

    return { sdThumbnail, hdThumbnail };
}

async function processImageFile(fileData: FileData): Promise<InternalImageResult> {
    console.log(`Processing image: ${fileData.name} (${fileData.type})`);

    // Prefer HD thumbnail, fallback to SD if not available
    const { sdThumbnail, hdThumbnail } = await reduceImageSize(fileData);

    const hdImage = hdThumbnail ?? sdThumbnail;
    const previewThumbnail = sdThumbnail ?? hdThumbnail;

    if (!hdImage) {
        throw new Error('No thumbnails were generated');
    }
    return {
        type: 'image',
        originalSize: fileData.size,
        hdImageSize: hdImage.byteLength,
        hdImage,
        previewThumbnail,
    };
}

export type FileProcessingServiceProps = {
    enableImageTools: boolean;
};

export class FileProcessingService {
    private static instance: FileProcessingService | null = null;
    
    private enableImageTools: boolean;

    private worker: Worker | null = null;

    private requestCounter = 0;

    private pendingRequests = new Map<
        string,
        {
            resolve: (result: FileProcessingResponse) => void;
            reject: (error: Error) => void;
        }
    >();

    private constructor(props: FileProcessingServiceProps) {
        this.enableImageTools = props.enableImageTools;
        this.initializeWorker();
    }
    /**
     * Get the singleton instance of the FileProcessingService
     * @returns The singleton instance of the FileProcessingService
     */
    static getInstance(props: FileProcessingServiceProps): FileProcessingService {
        if (!FileProcessingService.instance) {
            FileProcessingService.instance = new FileProcessingService(props);
        } else {
            // Update enableImageTools if it changed
            FileProcessingService.instance.enableImageTools = props.enableImageTools;
        }
        return FileProcessingService.instance;
    }

    private initializeWorker() {
        try {
            // Create the worker
            this.worker = new Worker(new URL('./workers/fileProcessingWorker.ts', import.meta.url), {
                type: 'module',
            });

            // Handle messages from worker
            this.worker.addEventListener('message', (event: MessageEvent<FileProcessingResponse>) => {
                this.onMessage(event);
            });

            // Handle worker errors
            this.worker.addEventListener('error', (error) => {
                this.onError(error);
            });

            // Handle worker termination
            this.worker.addEventListener('messageerror', (error) => {
                this.onMessageError(error);
            });
        } catch (error) {
            console.error('[FileProcessingService] Failed to initialize worker:', error);
            this.worker = null;
        }
    }

    private onMessageError(error: MessageEvent<any>) {
        console.error('Worker message error:', error);
        // Reject all pending requests
        this.pendingRequests.forEach(({ reject }) => {
            reject(new Error('Worker message error'));
        });
        this.pendingRequests.clear();
    }

    private onError(error: ErrorEvent) {
        console.error('[FileProcessingService] Worker error:', error.message);
        
        // Worker failed to initialize - mark it as dead
        this.worker = null;
        
        // Reject all pending requests
        this.pendingRequests.forEach(({ reject }) => {
            reject(new Error('Worker error: ' + error.message));
        });
        this.pendingRequests.clear();
    }

    private onMessage(event: MessageEvent<FileProcessingResponse>) {
        const response = event.data;
        const pending = this.pendingRequests.get(response.id);

        if (pending) {
            this.pendingRequests.delete(response.id);
            pending.resolve(response);
        }
    }

    // Dynamic timeout based on file size and type
    private getTimeout(fileSize: number, fileType: string): number {
        // Base timeout
        let timeout = 30000; // 30 seconds

        // Increase timeout for larger files
        if (fileSize > 10 * 1024 * 1024) {
            // > 10MB
            timeout = 120000; // 2 minutes
        } else if (fileSize > 5 * 1024 * 1024) {
            // > 5MB
            timeout = 90000; // 1.5 minutes
        } else if (fileSize > 1 * 1024 * 1024) {
            // > 1MB
            timeout = 60000; // 1 minute
        }

        // CSV and Excel files get extra time since they might have many rows
        if (
            fileType === 'text/csv' ||
            fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            fileType === 'application/vnd.ms-excel'
        ) {
            timeout = Math.max(timeout, 60000); // Minimum 1 minute for spreadsheets
        }

        return timeout;
    }

    async processFile(file: File): Promise<FileProcessingResponse> {
        return new Promise<FileProcessingResponse>((resolve, reject) => {
            const id = `file-${++this.requestCounter}-${Date.now()}`;

            // Store the promise resolvers
            this.pendingRequests.set(id, { resolve, reject });

            // Convert file to ArrayBuffer and send to worker
            this.makeRequest(id, file)
                .then((request) => this.process(request))
                .catch((error) => {
                    // Clean up pending request on error
                    this.pendingRequests.delete(id);
                    reject(error);
                });

            // Set a timeout to prevent hanging requests
            const timeout = this.getTimeout(file.size, file.type);
            this.ensureFinishedAfterTimeout(id, reject, timeout);
        });
    }

    private async process(request: FileProcessingRequest) {
        if (this.needsMainThread(request)) {
            await this.processOnMainThread(request);
        } else {
            this.sendToWorker(request);
        }
    }

    // We need to process image requests on the main thread due to the
    // thumbnail generation API, which is currently not worker compatible.
    needsMainThread(request: FileProcessingRequest) {
        const { file } = request;
        const category = getProcessingCategory(file.type, file.name);
        return category === 'image';
    }

    async processOnMainThread(request: FileProcessingRequest) {
        const { file } = request;
        const category = getProcessingCategory(file.type, file.name);
        switch (category) {
            case 'image':
                if (!this.enableImageTools) {
                    throw new Error('Unsupported file type');
                }
                const result = await processImageFile(file);
                const extResult: ImageProcessingResult = { id: request.id, ...result };
                this.onMessage({ data: extResult } as MessageEvent<ImageProcessingResult>);
                return result;
            default:
                throw new Error('Unsupported file type');
        }
    }

    private async makeRequest(id: string, file: File): Promise<FileProcessingRequest> {
        const data = await file.arrayBuffer();
        return {
            id,
            file: {
                name: file.name,
                type: file.type,
                size: file.size,
                data,
            },
        };
    }

    private ensureFinishedAfterTimeout(id: string, reject: (reason?: any) => void, timeout: number) {
        setTimeout(() => {
            if (this.pendingRequests.has(id)) {
                this.pendingRequests.delete(id);
                reject(
                    new Error(
                        `File processing timeout after ${timeout / 1000} seconds. Large files may require breaking into smaller chunks.`
                    )
                );
            }
        }, timeout);
    }

    private sendToWorker(request: FileProcessingRequest) {
        if (!this.worker) {
            throw new Error('File processing worker failed to initialize. Please refresh the page and try again.');
        }

        // Message is received in fileProcessingWorker.ts
        this.worker.postMessage(request);
    }

    cleanup() {
        if (this.worker) {
            // Send cleanup message to worker before terminating
            try {
                this.worker.postMessage({ type: 'cleanup' });
            } catch (e) {
                // Worker may already be terminated
                console.warn('Failed to send cleanup message to worker:', e);
            }
            
            // Give worker a brief moment to cleanup, then terminate
            setTimeout(() => {
                if (this.worker) {
                    this.worker.terminate();
                    this.worker = null;
                }
            }, 100);
        }

        // Reject all pending requests
        this.pendingRequests.forEach(({ reject }) => {
            reject(new Error('Service terminated'));
        });
        this.pendingRequests.clear();
    }
}

// Create a singleton instance
// export const fileProcessingService = new FileProcessingService(); // todo remove
