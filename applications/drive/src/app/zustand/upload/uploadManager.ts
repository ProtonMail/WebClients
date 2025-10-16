import { SDKEvent, getDrive } from '@proton/drive';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { useUploadControllerStore } from './uploadController.store';
import { UploadEventType, startUpload } from './uploadHandler';
import { UploadStatus, useUploadQueueStore } from './uploadQueue.store';
import { useUploadUIStore } from './uploadUI.store';

class UploadManager {
    private sdkEventsDisposer: (() => void) | null = null;
    private isAutomaticallyPaused = false;

    async uploadFiles(files: File[], parentUid: string): Promise<void> {
        const uploadQueueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();
        const uiStore = useUploadUIStore.getState();
        const actionEventManager = getActionEventManager();

        if (!this.sdkEventsDisposer && uploadQueueStore.queue.size === 0) {
            this.subscribeToSDKEvents();
        }

        for (const file of files) {
            const uploadId = uploadQueueStore.addUploadItem({
                name: file.name,
                progress: 0,
                status: UploadStatus.Pending,
            });

            uiStore.addItem({
                uploadId,
                name: file.name,
                progress: 0,
                status: UploadStatus.Pending,
            });

            // TOOD: Add scheduler logic
            void startUpload(file, parentUid, async (event) => {
                switch (event.type) {
                    case UploadEventType.ControllerReady:
                        controllerStore.setController(uploadId, {
                            uploadController: event.controller,
                            abortController: event.abortController,
                        });
                        break;
                    case UploadEventType.Progress:
                        if (!this.isAutomaticallyPaused) {
                            uploadQueueStore.updateUploadItem(uploadId, {
                                progress: event.progress,
                                status: UploadStatus.Uploading,
                            });
                            uiStore.updateItem(uploadId, {
                                progress: event.progress,
                                status: UploadStatus.Uploading,
                            });
                        }
                        break;
                    case UploadEventType.Error:
                        const err = event.error instanceof Error ? event.error : new Error('Failed');
                        uploadQueueStore.updateUploadItem(uploadId, {
                            status: UploadStatus.Failed,
                            error: err,
                        });
                        uiStore.updateItem(uploadId, {
                            status: UploadStatus.Failed,
                            error: err,
                        });
                        controllerStore.removeController(uploadId);
                        this.checkAndUnsubscribeIfQueueEmpty();
                        handleSdkError(event.error);
                        break;
                    case UploadEventType.Complete:
                        await actionEventManager.emit({
                            type: ActionEventName.CREATED_NODES,
                            items: [{ uid: event.nodeUid, parentUid }],
                        });
                        uploadQueueStore.updateUploadItem(uploadId, {
                            status: UploadStatus.Finished,
                        });
                        uiStore.updateItem(uploadId, {
                            status: UploadStatus.Finished,
                        });
                        controllerStore.removeController(uploadId);
                        this.checkAndUnsubscribeIfQueueEmpty();
                        break;
                }
            });
        }
    }

    cancelUpload(uploadId: string): void {
        const controllerStore = useUploadControllerStore.getState();
        const uploadQueueStore = useUploadQueueStore.getState();
        const uiStore = useUploadUIStore.getState();

        const storedController = controllerStore.getController(uploadId);
        if (storedController) {
            storedController.abortController.abort();
            uploadQueueStore.updateUploadItem(uploadId, { status: UploadStatus.Cancelled });
            uiStore.updateItem(uploadId, { status: UploadStatus.Cancelled });
            controllerStore.removeController(uploadId);
        }
    }

    removeUploads(uploadIds: string[]): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();
        const uiStore = useUploadUIStore.getState();

        uploadIds.forEach((id) => controllerStore.removeController(id));
        uploadQueueStore.removeUploadItems(uploadIds);
        uiStore.removeItems(uploadIds);

        this.checkAndUnsubscribeIfQueueEmpty();
    }

    clearUploadQueue(): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();
        const uiStore = useUploadUIStore.getState();

        controllerStore.clearAllControllers();
        uploadQueueStore.clearQueue();
        uiStore.clearAll();

        if (this.sdkEventsDisposer) {
            this.unsubscribeFromSDKEvents();
        }
    }

    getCapacity() {
        const uiStore = useUploadUIStore.getState();
        return {
            activeUploads: uiStore.getAll().length,
            isAutomaticallyPaused: this.isAutomaticallyPaused,
        };
    }

    hasActiveUploads(): boolean {
        const uiStore = useUploadUIStore.getState();
        const items = uiStore.getAll();
        return items.some(
            (item) =>
                item.status === UploadStatus.Uploading ||
                item.status === UploadStatus.Pending ||
                item.status === UploadStatus.PausedServer
        );
    }

    private subscribeToSDKEvents(): void {
        if (this.sdkEventsDisposer) {
            return;
        }

        const drive = getDrive();

        const unsubscribePaused = drive.onMessage(SDKEvent.TransfersPaused, () => this.handleTransfersPaused());
        const unsubscribeResumed = drive.onMessage(SDKEvent.TransfersResumed, () => this.handleTransfersResumed());

        this.sdkEventsDisposer = () => {
            unsubscribePaused();
            unsubscribeResumed();
        };
    }

    private unsubscribeFromSDKEvents(): void {
        if (!this.sdkEventsDisposer) {
            return;
        }

        this.sdkEventsDisposer();
        this.sdkEventsDisposer = null;
    }

    private handleTransfersPaused(): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const uiStore = useUploadUIStore.getState();
        this.isAutomaticallyPaused = true;

        const queue = uploadQueueStore.getQueue();
        queue.forEach(({ uploadId, item }) => {
            if (item.status === UploadStatus.Uploading || item.status === UploadStatus.Pending) {
                uploadQueueStore.updateUploadItem(uploadId, { status: UploadStatus.PausedServer });
                uiStore.updateItem(uploadId, { status: UploadStatus.PausedServer });
            }
        });
    }

    private handleTransfersResumed(): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const uiStore = useUploadUIStore.getState();
        this.isAutomaticallyPaused = false;

        const queue = uploadQueueStore.getQueue();
        queue.forEach(({ uploadId, item }) => {
            if (item.status === UploadStatus.PausedServer) {
                uploadQueueStore.updateUploadItem(uploadId, { status: UploadStatus.Uploading });
                uiStore.updateItem(uploadId, { status: UploadStatus.Uploading });
            }
        });
    }

    private checkAndUnsubscribeIfQueueEmpty(): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const activeUploads = uploadQueueStore
            .getQueue()
            .filter(
                ({ item }) =>
                    ![UploadStatus.Finished, UploadStatus.Failed, UploadStatus.Cancelled].includes(item.status)
            );

        if (activeUploads.length === 0 && this.sdkEventsDisposer) {
            this.unsubscribeFromSDKEvents();
        }
    }
}

export const uploadManager = new UploadManager();
