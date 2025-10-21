import { SDKEvent, getDrive } from '@proton/drive';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { useUploadControllerStore } from './uploadController.store';
import { type UploadEvent, UploadEventType, startUpload } from './uploadHandler';
import { UploadStatus, useUploadQueueStore } from './uploadQueue.store';
import { useUploadUIStore } from './uploadUI.store';
import { type FolderNode, buildFolderStructure } from './utils/buildFolderStructure';
import { hasFolderStructure } from './utils/hasFolderStructure';
import { processDroppedItems } from './utils/processDroppedItems';

interface FolderStructureWithUids {
    nodeUid: string;
    files: File[];
    subfolders: Map<string, FolderStructureWithUids>;
}

class UploadManager {
    private sdkEventsDisposer: (() => void) | null = null;
    private isAutomaticallyPaused = false;

    private async createFolder(folderName: string, parentUid: string, modificationTime?: Date): Promise<string> {
        const drive = getDrive();
        const folder = await drive.createFolder(parentUid, folderName, modificationTime);
        // TODO: Find a way to show the folder creation in TransferManager. It is different from file queue
        return folder.ok ? folder.value.uid : folder.error.uid;
    }

    private async createFolderStructure(node: FolderNode, parentUid: string): Promise<FolderStructureWithUids> {
        const currentUid = await this.createFolder(node.name, parentUid);

        const subfolders = new Map<string, FolderStructureWithUids>();

        for (const [folderName, subfolder] of node.subfolders) {
            const subfolderWithUid = await this.createFolderStructure(subfolder, currentUid);
            subfolders.set(folderName, subfolderWithUid);
        }

        return {
            nodeUid: currentUid,
            files: node.files,
            subfolders,
        };
    }

    private async onChangeCallback(uploadId: string, parentUid: string, event: UploadEvent): Promise<void> {
        const controllerStore = useUploadControllerStore.getState();
        const actionEventManager = getActionEventManager();
        const uploadQueueStore = useUploadQueueStore.getState();
        const uiStore = useUploadUIStore.getState();
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
                        uploadedBytes: event.uploadedBytes,
                        status: UploadStatus.InProgress,
                    });
                    uiStore.updateItem(uploadId, {
                        uploadedBytes: event.uploadedBytes,
                        status: UploadStatus.InProgress,
                    });
                }
                break;
            case UploadEventType.Error:
                const currentItem = uploadQueueStore.getQueueItem(uploadId);
                if (currentItem?.status === UploadStatus.Cancelled) {
                    break;
                }

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
    }

    // TOOD: Add scheduler logic
    async uploadFiles(files: File[], parentUid: string): Promise<void> {
        const uploadQueueStore = useUploadQueueStore.getState();
        const uiStore = useUploadUIStore.getState();

        if (!this.sdkEventsDisposer && uploadQueueStore.queue.size === 0) {
            this.subscribeToSDKEvents();
        }

        for (const file of files) {
            const uploadId = uploadQueueStore.addUploadItem({
                name: file.name,
                uploadedBytes: 0, // TODO: Probably we can prevent having to pass the 0 at the beggining
                clearTextExpectedSize: file.size,
                status: UploadStatus.Pending,
            });

            uiStore.addItem({
                uploadId,
                uploadedBytes: 0,
                clearTextExpectedSize: file.size,
                name: file.name,
                status: UploadStatus.Pending,
            });

            void startUpload(file, parentUid, (event) => this.onChangeCallback(uploadId, parentUid, event));
        }
    }

    async uploadFolder(files: File[] | FileList, parentUid: string): Promise<void> {
        const uploadQueueStore = useUploadQueueStore.getState();

        if (!this.sdkEventsDisposer && uploadQueueStore.queue.size === 0) {
            this.subscribeToSDKEvents();
        }

        const structure = buildFolderStructure(files);

        const folderStructureWithUids = await this.createFolderStructure(structure, parentUid);

        this.uploadFilesFromFolderStructure(folderStructureWithUids, parentUid);
    }

    async uploadFileDrop(items: DataTransferItemList, parentUid: string) {
        const files = await processDroppedItems(items);

        if (hasFolderStructure(files)) {
            await this.uploadFolder(files, parentUid);
        } else {
            await this.uploadFiles(files, parentUid);
        }
    }

    private uploadFilesFromFolderStructure(
        folderStructure: { nodeUid: string; files: File[]; subfolders: Map<string, any> },
        rootParentUid: string
    ): void {
        void this.uploadFiles(folderStructure.files, folderStructure.nodeUid);

        for (const [, subfolder] of folderStructure.subfolders) {
            void this.uploadFilesFromFolderStructure(subfolder, rootParentUid);
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

    getCapacity(): {
        activeUploads: number;
        isAutomaticallyPaused: boolean;
    } {
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
                item.status === UploadStatus.InProgress ||
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
            if (item.status === UploadStatus.InProgress || item.status === UploadStatus.Pending) {
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
                uploadQueueStore.updateUploadItem(uploadId, { status: UploadStatus.InProgress });
                uiStore.updateItem(uploadId, { status: UploadStatus.InProgress });
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
