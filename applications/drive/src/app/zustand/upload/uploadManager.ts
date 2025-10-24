import { NodeType, NodeWithSameNameExistsValidationError, SDKEvent, getDrive } from '@proton/drive';
import generateUID from '@proton/utils/generateUID';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { UploadConflictStrategy, UploadConflictType } from './types';
import { useUploadControllerStore } from './uploadController.store';
import { type UploadEvent, UploadEventType, startUpload } from './uploadHandler';
import { UploadStatus, useUploadQueueStore } from './uploadQueue.store';
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

    private async createFolder(
        folderName: string,
        parentUid: string,
        batchId: string,
        modificationTime?: Date
    ): Promise<string | null> {
        const drive = getDrive();
        try {
            const folder = await drive.createFolder(parentUid, folderName, modificationTime);
            // TODO: Find a way to show the folder creation in TransferManager. It is different from file queue
            return folder.ok ? folder.value.uid : folder.error.uid;
        } catch (error) {
            if (error instanceof NodeWithSameNameExistsValidationError && error.existingNodeUid) {
                const uploadQueueStore = useUploadQueueStore.getState();

                if (uploadQueueStore.batchStrategy && uploadQueueStore.activeConflictBatchId === batchId) {
                    return this.handleFolderConflictStrategy(
                        uploadQueueStore.batchStrategy,
                        folderName,
                        parentUid,
                        error.existingNodeUid,
                        modificationTime
                    );
                }

                if (!uploadQueueStore.activeConflictBatchId) {
                    uploadQueueStore.setActiveConflictBatch(batchId);
                }

                const strategy = await new Promise<UploadConflictStrategy>((resolve) => {
                    uploadQueueStore.addUploadItem({
                        name: folderName,
                        uploadedBytes: 0,
                        clearTextExpectedSize: 0,
                        batchId,
                        status: UploadStatus.ConflictFound,
                        conflictType: UploadConflictType.Normal,
                        nodeType: NodeType.Folder,
                        resolve,
                    });
                });

                return this.handleFolderConflictStrategy(
                    strategy,
                    folderName,
                    parentUid,
                    error.existingNodeUid,
                    modificationTime
                );
            }
            throw error;
        }
    }

    private async handleFolderConflictStrategy(
        strategy: string,
        folderName: string,
        parentUid: string,
        existingFolderUid: string,
        // TODO: Will be used with Rename
        _modificationTime?: Date
    ): Promise<string | null> {
        if (strategy === UploadConflictStrategy.Replace) {
            return existingFolderUid;
        } else if (strategy === UploadConflictStrategy.Rename) {
            throw new Error('Rename strategy for folders is not yet implemented');
        } else if (strategy === UploadConflictStrategy.Skip) {
            // Skip this folder - return null to signal skip
            // All files in this folder will be skipped
            return null;
        }

        throw new Error(`Unknown conflict strategy: ${strategy}`);
    }

    private async createFolderStructure(
        node: FolderNode,
        parentUid: string,
        batchId: string
    ): Promise<FolderStructureWithUids | null> {
        const currentUid = await this.createFolder(node.name, parentUid, batchId);

        if (currentUid === null) {
            return null;
        }

        const subfolders = new Map<string, FolderStructureWithUids>();

        for (const [folderName, subfolder] of node.subfolders) {
            const subfolderWithUid = await this.createFolderStructure(subfolder, currentUid, batchId);
            if (subfolderWithUid !== null) {
                subfolders.set(folderName, subfolderWithUid);
            }
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
                controllerStore.removeController(uploadId);
                this.checkAndUnsubscribeIfQueueEmpty();
                break;
            case UploadEventType.ConflictFound:
                const uploadItem = uploadQueueStore.getQueueItem(uploadId);
                if (!uploadItem) {
                    break;
                }
                if (!uploadQueueStore.activeConflictBatchId) {
                    uploadQueueStore.setActiveConflictBatch(uploadItem.batchId);
                }

                // The conflict resolution is handled via the onConflict callback in startUpload
                // which updates the item with conflict-specific data including the resolve callback
                break;
        }
    }

    private async resolveConflict(
        uploadId: string,
        name: string,
        nodeType: NodeType,
        conflictType: UploadConflictType
    ): Promise<UploadConflictStrategy> {
        const uploadQueueStore = useUploadQueueStore.getState();

        const uploadItem = uploadQueueStore.getQueueItem(uploadId);
        if (!uploadItem) {
            throw new Error('Upload not found');
        }

        if (uploadQueueStore.batchStrategy && uploadQueueStore.activeConflictBatchId === uploadItem.batchId) {
            return uploadQueueStore.batchStrategy;
        }

        return new Promise<UploadConflictStrategy>((resolve) => {
            uploadQueueStore.updateUploadItem(uploadId, {
                status: UploadStatus.ConflictFound,
                conflictType,
                nodeType,
                resolve: (strategy: UploadConflictStrategy, applyToAll?: boolean) => {
                    if (applyToAll) {
                        uploadQueueStore.setBatchStrategy(strategy);
                    }
                    resolve(strategy);
                },
            });
        });
    }

    async upload(files: File[] | FileList, parentUid: string): Promise<void> {
        const uploadQueueStore = useUploadQueueStore.getState();

        const batchId = generateUID();

        if (!this.sdkEventsDisposer && uploadQueueStore.queue.size === 0) {
            this.subscribeToSDKEvents();
        }

        const filesArray = Array.from(files);
        const hasStructure = hasFolderStructure(filesArray);

        if (!hasStructure) {
            const flatStructure: FolderStructureWithUids = {
                nodeUid: parentUid,
                files: filesArray,
                subfolders: new Map(),
            };
            this.uploadFilesFromFolderStructure(flatStructure, parentUid, batchId);
            return;
        }

        const structure = buildFolderStructure(files);
        const folderStructureWithUids = await this.createFolderStructure(structure, parentUid, batchId);

        if (folderStructureWithUids === null) {
            return;
        }

        this.uploadFilesFromFolderStructure(folderStructureWithUids, parentUid, batchId);
    }

    async uploadDrop(items: DataTransferItemList, parentUid: string) {
        const uploadQueueStore = useUploadQueueStore.getState();

        if (uploadQueueStore.hasPendingConflicts()) {
            // TODO: Show notification to user: "Please resolve conflicts before uploading more files"
            console.warn('Cannot upload: pending conflicts must be resolved first');
            return;
        }

        const files = await processDroppedItems(items);
        await this.upload(files, parentUid);
    }

    private uploadFilesFromFolderStructure(
        folderStructure: FolderStructureWithUids,
        rootParentUid: string,
        batchId: string
    ): void {
        const uploadQueueStore = useUploadQueueStore.getState();

        for (const file of folderStructure.files) {
            const uploadId = uploadQueueStore.addUploadItem({
                name: file.name,
                uploadedBytes: 0,
                clearTextExpectedSize: file.size,
                status: UploadStatus.Pending,
                batchId,
            });

            void startUpload(
                file,
                folderStructure.nodeUid,
                (event) => this.onChangeCallback(uploadId, folderStructure.nodeUid, event),
                (name, nodeType, conflictType) => this.resolveConflict(uploadId, name, nodeType, conflictType)
            );
        }

        for (const [, subfolder] of folderStructure.subfolders) {
            void this.uploadFilesFromFolderStructure(subfolder, rootParentUid, batchId);
        }
    }

    cancelUpload(uploadId: string): void {
        const controllerStore = useUploadControllerStore.getState();
        const uploadQueueStore = useUploadQueueStore.getState();

        const storedController = controllerStore.getController(uploadId);
        if (storedController) {
            storedController.abortController.abort();
            uploadQueueStore.updateUploadItem(uploadId, { status: UploadStatus.Cancelled });
            controllerStore.removeController(uploadId);
        }
    }

    removeUploads(uploadIds: string[]): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();

        uploadIds.forEach((id) => controllerStore.removeController(id));
        uploadQueueStore.removeUploadItems(uploadIds);

        this.checkAndUnsubscribeIfQueueEmpty();
    }

    clearUploadQueue(): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();

        controllerStore.clearAllControllers();
        uploadQueueStore.clearQueue();

        if (this.sdkEventsDisposer) {
            this.unsubscribeFromSDKEvents();
        }
    }

    getCapacity(): {
        isAutomaticallyPaused: boolean;
    } {
        return {
            isAutomaticallyPaused: this.isAutomaticallyPaused,
        };
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
        this.isAutomaticallyPaused = true;

        const queue = uploadQueueStore.getQueue();
        queue.forEach(({ uploadId, item }) => {
            if (item.status === UploadStatus.InProgress || item.status === UploadStatus.Pending) {
                uploadQueueStore.updateUploadItem(uploadId, { status: UploadStatus.PausedServer });
            }
        });
    }

    private handleTransfersResumed(): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        this.isAutomaticallyPaused = false;

        const queue = uploadQueueStore.getQueue();
        queue.forEach(({ uploadId, item }) => {
            if (item.status === UploadStatus.PausedServer) {
                uploadQueueStore.updateUploadItem(uploadId, { status: UploadStatus.InProgress });
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
