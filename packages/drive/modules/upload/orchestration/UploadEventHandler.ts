import type { CapacityManager } from '../scheduling/CapacityManager';
import { useUploadControllerStore } from '../store/uploadController.store';
import { useUploadQueueStore } from '../store/uploadQueue.store';
import type { FileUploadEvent, FolderCreationEvent, UploadEvent } from '../types';
import { UploadStatus } from '../types';
import { getBlockedChildren } from '../utils/dependencyHelpers';
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
    private onUploadEventCallback: ((event: UploadEvent) => Promise<void>) | undefined = undefined;

    constructor(
        private capacityManager: CapacityManager,
        private conflictManager: ConflictManager,
        private sdkTransferActivity: SDKTransferActivity,
        private cancelFolderChildren: (uploadId: string) => void
    ) {
        this.eventHandlers = {
            'file:started': (event: Extract<UploadEvent, { type: 'file:started' }>) => this.handleFileStarted(event),
            'file:progress': (event: Extract<UploadEvent, { type: 'file:progress' }>) => this.handleFileProgress(event),
            'file:complete': (event: Extract<UploadEvent, { type: 'file:complete' }>) => this.handleFileComplete(event),
            'file:error': (event: Extract<UploadEvent, { type: 'file:error' }>) => this.handleFileError(event),
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

    onUploadEvent(callback: (event: UploadEvent) => Promise<void>) {
        this.onUploadEventCallback = callback;
    }

    async handleEvent(event: UploadEvent): Promise<void> {
        const handler = this.eventHandlers[event.type];
        if (handler) {
            await this.onUploadEventCallback?.(event);
            // We have to cast here to be able to call the handler.
            await (handler as (event: UploadEvent) => void | Promise<void>)(event);
        }
    }

    private handleFileStarted(event: FileUploadEvent & { type: 'file:started' }): void {
        const controllerStore = useUploadControllerStore.getState();
        controllerStore.setController(event.uploadId, {
            uploadController: event.controller,
            abortController: event.abortController,
        });
    }

    private handleFileProgress(event: FileUploadEvent & { type: 'file:progress' }): void {
        const queueStore = useUploadQueueStore.getState();
        if (
            this.sdkTransferActivity.isPaused() ||
            queueStore.getItem(event.uploadId)?.status === UploadStatus.Cancelled
        ) {
            return;
        }

        queueStore.updateQueueItems(event.uploadId, {
            uploadedBytes: event.uploadedBytes,
        });
        this.capacityManager.updateProgress(event.uploadId, event.uploadedBytes);
    }

    private async handleFileComplete(event: FileUploadEvent & { type: 'file:complete' }): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();
        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.Finished,
            nodeUid: event.nodeUid,
        });
        controllerStore.removeController(event.uploadId);
        this.sdkTransferActivity.checkAndUnsubscribeIfQueueEmpty();
    }

    private handleFileError(event: FileUploadEvent & { type: 'file:error' }): void {
        const queueStore = useUploadQueueStore.getState();
        if (queueStore.getItem(event.uploadId)?.status === UploadStatus.Cancelled) {
            return;
        }
        const controllerStore = useUploadControllerStore.getState();

        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.Failed,
            error: event.error,
        });
        controllerStore.removeController(event.uploadId);
        this.sdkTransferActivity.checkAndUnsubscribeIfQueueEmpty();
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
        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.Failed,
            error: event.error,
        });
        this.cancelFolderChildren(event.uploadId);
        this.sdkTransferActivity.checkAndUnsubscribeIfQueueEmpty();
    }

    private handleFileCancelled(event: FileUploadEvent & { type: 'file:cancelled' }): void {
        const queueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();

        const controller = controllerStore.getController(event.uploadId);
        if (controller) {
            controller.abortController.abort();
        }

        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.Cancelled,
        });
        controllerStore.removeController(event.uploadId);
        this.sdkTransferActivity.checkAndUnsubscribeIfQueueEmpty();
    }

    private handleFolderCancelled(event: FolderCreationEvent & { type: 'folder:cancelled' }): void {
        const queueStore = useUploadQueueStore.getState();

        queueStore.updateQueueItems(event.uploadId, {
            status: UploadStatus.Cancelled,
        });
        this.cancelFolderChildren(event.uploadId);
        this.sdkTransferActivity.checkAndUnsubscribeIfQueueEmpty();
    }
}
