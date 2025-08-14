import type { FileProcessingRequest, FileProcessingResponse } from '../workers/fileProcessingWorker';

export class FileProcessingService {
    private worker: Worker | null = null;

    private requestCounter = 0;

    private pendingRequests = new Map<
        string,
        {
            resolve: (result: FileProcessingResponse) => void;
            reject: (error: Error) => void;
        }
    >();

    constructor() {
        this.initializeWorker();
    }

    private initializeWorker() {
        try {
            // Create the worker
            this.worker = new Worker(new URL('../workers/fileProcessingWorker.ts', import.meta.url), {
                type: 'module',
            });

            // Handle messages from worker
            this.worker.addEventListener('message', (event: MessageEvent<FileProcessingResponse>) => {
                const response = event.data;
                const pending = this.pendingRequests.get(response.id);

                if (pending) {
                    this.pendingRequests.delete(response.id);
                    pending.resolve(response);
                }
            });

            // Handle worker errors
            this.worker.addEventListener('error', (error) => {
                console.error('Worker error:', error);
                // Reject all pending requests
                this.pendingRequests.forEach(({ reject }) => {
                    reject(new Error('Worker error: ' + error.message));
                });
                this.pendingRequests.clear();
            });

            // Handle worker termination
            this.worker.addEventListener('messageerror', (error) => {
                console.error('Worker message error:', error);
                // Reject all pending requests
                this.pendingRequests.forEach(({ reject }) => {
                    reject(new Error('Worker message error'));
                });
                this.pendingRequests.clear();
            });
        } catch (error) {
            console.error('Failed to initialize file processing worker:', error);
            this.worker = null;
        }
    }

    async processFile(file: File): Promise<{
        success: boolean;
        result?: {
            originalContent: string;
            convertedContent: string;
            originalSize: number;
            convertedSize: number;
            truncated?: boolean;
            originalRowCount?: number;
            processedRowCount?: number;
        };
        error?: string;
        isUnsupported?: boolean;
    }> {
        if (!this.worker) {
            // Fallback to synchronous processing if worker failed to initialize
            console.warn('Worker not available, falling back to synchronous processing');
            return this.processSynchronously(file);
        }

        return new Promise<FileProcessingResponse>((resolve, reject) => {
            const id = `file-${++this.requestCounter}-${Date.now()}`;

            // Store the promise resolvers
            this.pendingRequests.set(id, { resolve, reject });

            // Convert file to ArrayBuffer and send to worker
            file.arrayBuffer()
                .then((data) => {
                    const request: FileProcessingRequest = {
                        id,
                        file: {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            data,
                        },
                    };

                    this.worker!.postMessage(request);
                })
                .catch((error) => {
                    // Clean up pending request on error
                    this.pendingRequests.delete(id);
                    reject(error);
                });

            // Dynamic timeout based on file size and type
            const getTimeout = (fileSize: number, fileType: string): number => {
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
            };

            // Set a timeout to prevent hanging requests
            const timeout = getTimeout(file.size, file.type);
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
        });
    }

    private async processSynchronously(file: File): Promise<FileProcessingResponse> {
        // Fallback when worker is not available
        console.warn('File processing worker unavailable - please refresh the page and try again');

        return {
            id: 'fallback',
            success: false,
            error: 'File processing worker unavailable. Please refresh the page and try again.',
        };
    }

    cleanup() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }

        // Reject all pending requests
        this.pendingRequests.forEach(({ reject }) => {
            reject(new Error('Service terminated'));
        });
        this.pendingRequests.clear();
    }
}

// Create a singleton instance
export const fileProcessingService = new FileProcessingService();
