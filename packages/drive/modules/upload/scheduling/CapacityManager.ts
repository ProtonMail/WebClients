import type { SchedulerLoad } from '../types';

/**
 * Manages capacity tracking for concurrent uploads
 * Tracks preparing files (thumbnail+metadata phase) and uploading files (SDK phase) separately,
 * allowing the orchestrator to start new preparations as soon as a file moves to Waiting.
 */
export class CapacityManager {
    private preparingFiles = new Set<string>();
    private uploadingFiles = new Set<string>();
    private activeFolders = 0;
    private fileLoads = new Map<string, { totalBytes: number; uploadedBytes: number }>();

    /**
     * Gets current load snapshot
     * @returns Current scheduler load with active counts and remaining bytes
     */
    getCurrentLoad(): SchedulerLoad {
        return {
            activePreparingFiles: this.preparingFiles.size,
            activeUploadingFiles: this.uploadingFiles.size,
            activeFolders: this.activeFolders,
            activeBytesTotal: this.getRemainingUploadBytes(),
            taskLoads: new Map(this.fileLoads),
        };
    }

    /**
     * Reserves capacity for a file in the preparing phase (thumbnail + metadata)
     * @param uploadId - Unique task identifier
     */
    reservePreparing(uploadId: string): void {
        this.preparingFiles.add(uploadId);
    }

    /**
     * Releases capacity for a file that completed the preparing phase
     * @param uploadId - Unique task identifier
     */
    releasePreparing(uploadId: string): void {
        this.preparingFiles.delete(uploadId);
    }

    /**
     * Reserves capacity for a file in the uploading phase (SDK slot acquired)
     * @param uploadId - Unique task identifier
     * @param sizeBytes - Total file size in bytes
     */
    reserveUploading(uploadId: string, sizeBytes: number): void {
        this.uploadingFiles.add(uploadId);
        this.fileLoads.set(uploadId, { totalBytes: sizeBytes, uploadedBytes: 0 });
    }

    /**
     * Releases capacity for a completed/failed file in the uploading phase
     * @param uploadId - Unique task identifier
     */
    releaseUploading(uploadId: string): void {
        this.uploadingFiles.delete(uploadId);
        this.fileLoads.delete(uploadId);
    }

    /**
     * Safe release that covers both phases — used in the executeTask finally block
     * to ensure no capacity leak regardless of which phase the upload was in.
     */
    releaseFile(uploadId: string): void {
        this.releasePreparing(uploadId);
        this.releaseUploading(uploadId);
    }

    /**
     * Reserves capacity for a folder creation
     */
    reserveFolder(): void {
        this.activeFolders++;
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
        this.preparingFiles.clear();
        this.uploadingFiles.clear();
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
