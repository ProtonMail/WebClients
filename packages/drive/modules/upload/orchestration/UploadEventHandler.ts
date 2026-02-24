import metrics from '@proton/metrics';

import { TransferSpeedMetrics } from '../../../internal/performance/transferSpeedMetrics';
import type { CapacityManager } from '../scheduling/CapacityManager';
import { useUploadControllerStore } from '../store/uploadController.store';
import { useUploadQueueStore } from '../store/uploadQueue.store';
import type { FileUploadEvent, FolderCreationEvent, PhotosUploadEvent, UploadEvent } from '../types';
import { UploadStatus } from '../types';
import { getBlockedChildren } from '../utils/dependencyHelpers';
import { uploadLogDebug, uploadLogError } from '../utils/uploadLogger';
import type { ConflictManager } from './ConflictManager';
import type { SDKTransferActivity } from './SDKTransferActivity';

/**
 * Handles upload events from executors and updates stores accordingly
 * Delegates to specialized managers for specific concerns
 */
export class UploadEventHandler {
    private eventHandlers: {
        [K in UploadEvent['type']]: (event: Extract<UploadEvent, { type: K }>) => void | Promise<void>;
    };
    private eventSubscriptions = new Map<string, (event: UploadEvent) => Promise<void>>();
    private uploadSpeedMetrics = new TransferSpeedMetrics((values) => {
        uploadLogDebug('Upload speed metrics', values);
        metrics.drive_upload_speed_histogram.observe({
            Labels: { context: 'foreground', pipeline: 'default' },
            Value: Math.round(values.kibibytesPerSecond),
        });
    });

    constructor(
        private capacityManager: CapacityManager,
        private conflictManager: ConflictManager,
        private sdkTransferActivity: SDKTransferActivity,
        private sdkPhotosTransferActivity: SDKTransferActivity,
        private cancelFolderChildren: (uploadId: string) => void
    ) {
        this.eventHandlers = {
            'file:queued': (event: Extract<UploadEvent, { type: 'file:queued' }>) => this.handleFileQueued(event),
            'file:preparing': (event: Extract<UploadEvent, { type: 'file:preparing' }>) =>
                this.handleFilePreparing(event),
            'file:started': (event: Extract<UploadEvent, { type: 'file:started' }>) => this.handleFileStarted(event),
            'file:progress': (event: Extract<UploadEvent, { type: 'file:progress' }>) => this.handleFileProgress(event),
            'file:complete': (event: Extract<UploadEvent, { type: 'file:complete' }>) => this.handleFileComplete(event),
            'file:error': (event: Extract<UploadEvent, { type: 'file:error' }>) => this.handleFileError(event),
            'photo:exist': (event: Extract<UploadEvent, { type: 'photo:exist' }>) => this.handlePhotoExist(event),
            'file:conflict': (event: Extract<UploadEvent, { type: 'file:conflict' }>) =>
                this.conflictManager.handleConflict(event.uploadId, event.error),
            'file:cancelled': (event: Extract<UploadEvent, { type: 'file:cancelled' }>) =>
                this.handleFileCancelled(event),
            'folder:conflict': (event: Extract<UploadEvent, { type: 'folder:conflict' }>) =>
                this.conflictManager.handleConflict(event.uploadId, event.error),
            'folder:complete': (event: Extract<UploadEvent, { type: 'folder:complete' }>) =>
                this.handleFolderComplete(event),
            'folder:error': (event: Extract<UploadEvent, { type: 'folder:error' }>) => this.handleFolderError(event),
            'folder:cancelled': (event: Extract<UploadEvent, { type: 'folder:cancelled' }>) =>
                this.handleFolderCancelled(event),
        };
    }

    subscribeToEvents(context: string, callback: (event: UploadEvent) => Promise<void>): () => void {
        this.eventSubscriptions.set(context, callback);
        return () => {
            this.eventSubscriptions.delete(context);
        };
    }

    hasSubscriptions(): boolean {
        return this.eventSubscriptions.size > 0;
    }

    async handleEvent(event: UploadEvent): Promise<void> {
        await Promise.all(
            Array.from(this.eventSubscriptions.values()).map((callback) => {
                return callback(event);
            })
        );

        const handler = this.eventHandlers[event.type];
        if (handler) {
            await (handler as (event: UploadEvent) => void | Promise<void>)(event);
        }
    }

    private handleFileQueued(event: FileUploadEvent & { type: 'file:queued' }): void {
        const controllerStore = useUploadControllerStore.getState();
        controllerStore.setAbortController(event.uploadId, event.abortController);
    }

    private handleFilePreparing(event: FileUploadEvent & { type: 'file:preparing' }): void {
        const queueStore = useUploadQueueStore.getState();
        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.Preparing,
        });
    }

    private handleFileStarted(event: FileUploadEvent & { type: 'file:started' }): void {
        const controllerStore = useUploadControllerStore.getState();
        controllerStore.setUploadController(event.uploadId, event.controller);
        this.uploadSpeedMetrics.onFileStarted(event.uploadId);
    }

    private handleFileProgress(event: FileUploadEvent & { type: 'file:progress' }): void {
        const queueStore = useUploadQueueStore.getState();
        const isPaused = event.isForPhotos
            ? this.sdkPhotosTransferActivity.isPaused()
            : this.sdkTransferActivity.isPaused();
        this.uploadSpeedMetrics.onFileProgress(event.uploadId, event.uploadedBytes, isPaused);
        if (isPaused || queueStore.getItem(event.uploadId)?.status === UploadStatus.Cancelled) {
            return;
        }

        queueStore.updateQueueItems(event.uploadId, {
            uploadedBytes: event.uploadedBytes,
            status: UploadStatus.InProgress,
        });
        this.capacityManager.updateProgress(event.uploadId, event.uploadedBytes);
    }

    private async handleFileComplete(event: FileUploadEvent & { type: 'file:complete' }): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();

        this.uploadSpeedMetrics.onFileEnded(event.uploadId);
        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.Finished,
            nodeUid: event.nodeUid,
        });
        controllerStore.removeController(event.uploadId);
        if (event.isForPhotos) {
            this.sdkPhotosTransferActivity.checkAndUnsubscribeIfQueueEmpty();
        } else {
            this.sdkTransferActivity.checkAndUnsubscribeIfQueueEmpty();
        }
    }

    private async handleFileError(event: FileUploadEvent & { type: 'file:error' }): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        this.uploadSpeedMetrics.onFileEnded(event.uploadId);
        if (queueStore.getItem(event.uploadId)?.status === UploadStatus.Cancelled) {
            return;
        }
        const controllerStore = useUploadControllerStore.getState();

        const uploadItem = queueStore.getItem(event.uploadId);
        uploadLogError('File upload failed', event.error, {
            uploadId: event.uploadId,
            fileName: uploadItem?.name,
        });

        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.Failed,
            error: event.error,
        });
        controllerStore.removeController(event.uploadId);
        if (event.isForPhotos) {
            this.sdkPhotosTransferActivity.checkAndUnsubscribeIfQueueEmpty();
        } else {
            this.sdkTransferActivity.checkAndUnsubscribeIfQueueEmpty();
        }
    }

    private async handleFolderComplete(event: FolderCreationEvent & { type: 'folder:complete' }): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.Finished,
            nodeUid: event.nodeUid,
        });

        const allItems = Array.from(queueStore.queue.values());
        const childrenIds = getBlockedChildren(event.uploadId, allItems);
        for (const childId of childrenIds) {
            queueStore.updateQueueItems(childId, {
                parentUid: event.nodeUid,
            });
        }

        this.sdkTransferActivity.checkAndUnsubscribeIfQueueEmpty();
    }

    private handleFolderError(event: FolderCreationEvent & { type: 'folder:error' }): void {
        const queueStore = useUploadQueueStore.getState();

        const uploadItem = queueStore.getItem(event.uploadId);
        uploadLogError('Folder creation failed', event.error, {
            uploadId: event.uploadId,
            folderName: uploadItem?.name,
        });

        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.Failed,
            error: event.error,
        });
        this.cancelFolderChildren(event.uploadId);
        this.sdkTransferActivity.checkAndUnsubscribeIfQueueEmpty();
    }

    private async handlePhotoExist(event: PhotosUploadEvent & { type: 'photo:exist' }): Promise<void> {
        const queueStore = useUploadQueueStore.getState();

        this.uploadSpeedMetrics.onFileEnded(event.uploadId);
        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.PhotosDuplicate,
            nodeUid: event.duplicateUids[0],
        });
    }

    private async handleFileCancelled(event: FileUploadEvent & { type: 'file:cancelled' }): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();

        this.uploadSpeedMetrics.onFileEnded(event.uploadId);
        const controller = controllerStore.getController(event.uploadId);
        if (controller) {
            controller.abortController.abort();
        }

        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.Cancelled,
        });
        controllerStore.removeController(event.uploadId);
        if (event.isForPhotos) {
            this.sdkPhotosTransferActivity.checkAndUnsubscribeIfQueueEmpty();
        } else {
            this.sdkTransferActivity.checkAndUnsubscribeIfQueueEmpty();
        }
    }

    private handleFolderCancelled(event: FolderCreationEvent & { type: 'folder:cancelled' }): void {
        const queueStore = useUploadQueueStore.getState();

        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.Cancelled,
        });
        this.cancelFolderChildren(event.uploadId);
        this.sdkTransferActivity.checkAndUnsubscribeIfQueueEmpty();
    }

    dispose(): void {
        this.uploadSpeedMetrics.dispose();
    }
}
