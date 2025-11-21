import type { SchedulerLoad } from '../types';

/**
 * Manages capacity tracking for concurrent uploads
 * Tracks active files, folders, and upload progress to enforce concurrency limits
 */
export class CapacityManager {
    private activeFiles = 0;
    private activeFolders = 0;
    private fileLoads = new Map<string, { totalBytes: number; uploadedBytes: number }>();

    /**
     * Gets current load snapshot
     * @returns Current scheduler load with active counts and remaining bytes
     */
    getCurrentLoad(): SchedulerLoad {
        return {
            activeFiles: this.activeFiles,
            activeFolders: this.activeFolders,
            activeBytesTotal: this.getRemainingUploadBytes(),
            taskLoads: new Map(this.fileLoads),
        };
    }

    /**
     * Reserves capacity for a file upload
     * @param uploadId - Unique task identifier
     * @param sizeBytes - Total file size in bytes
     */
    reserveFile(uploadId: string, sizeBytes: number): void {
        this.activeFiles++;
        this.fileLoads.set(uploadId, { totalBytes: sizeBytes, uploadedBytes: 0 });
    }

    /**
     * Reserves capacity for a folder creation
     */
    reserveFolder(): void {
        this.activeFolders++;
    }

    /**
     * Releases capacity for a completed/failed file upload
     * @param uploadId - Unique task identifier
     */
    releaseFile(uploadId: string): void {
        this.activeFiles--;
        this.fileLoads.delete(uploadId);
    }

    /**
     * Releases capacity for a completed/failed folder creation
     */
    releaseFolder(): void {
        this.activeFolders--;
    }

    /**
     * Updates upload progress for a file
     * @param uploadId - Unique task identifier
     * @param uploadedBytes - Number of bytes uploaded so far
     */
    updateProgress(uploadId: string, uploadedBytes: number): void {
        const load = this.fileLoads.get(uploadId);
        if (load) {
            load.uploadedBytes = uploadedBytes;
        }
    }

    /**
     * Resets all capacity tracking
     * Clears all active uploads and folders
     */
    reset(): void {
        this.activeFiles = 0;
        this.activeFolders = 0;
        this.fileLoads.clear();
    }

    /**
     * Calculates total remaining bytes across all active uploads
     * @returns Sum of (totalBytes - uploadedBytes) for all active files
     */
    private getRemainingUploadBytes(): number {
        let total = 0;
        for (const load of this.fileLoads.values()) {
            total += load.totalBytes - load.uploadedBytes;
        }
        return total;
    }
}
