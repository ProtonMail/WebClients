import { c } from 'ttag';

import { NodeType, NodeWithSameNameExistsValidationError, SDKEvent, getDrive } from '@proton/drive';
import generateUID from '@proton/utils/generateUID';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { MAX_UPLOAD_FOLDER_LOAD, MAX_UPLOAD_JOBS } from './constants';
import { UploadConflictStrategy, UploadConflictType } from './types';
import { useUploadControllerStore } from './uploadController.store';
import { type UploadEvent, UploadEventType, startUpload } from './uploadHandler';
import { type FileUploadItem, type FolderCreationItem, UploadStatus, useUploadQueueStore } from './uploadQueue.store';
import { type FolderNode, buildFolderStructure } from './utils/buildFolderStructure';
import { hasFolderStructure } from './utils/hasFolderStructure';
import { processDroppedItems } from './utils/processDroppedItems';

/**
 * Manages the upload queue and coordinates file/folder uploads
 * Handles scheduling, concurrency limits, folder structure creation, and conflict resolution.
 */
class UploadManager {
    private sdkEventsDisposer: (() => void) | null = null;
    private isAutomaticallyPaused = false;
    private activeUploads = 0;
    private activeFolders = 0;
    private isSchedulingFolders = false;
    private isSchedulingFiles = false;

    /**
     * Resolves a parent UID to its actual node UID.
     * If the parent is a queued folder with a nodeUid, returns that instead.
     * This allows files to reference their parent by queue ID before the folder is created.
     *
     * @param parentUid - The parent UID (either a real node UID or a queue item ID)
     * @returns The resolved node UID to use as parent
     */
    private resolveParentUid(parentUid: string): string {
        const uploadQueueStore = useUploadQueueStore.getState();
        const parentQueueItem = uploadQueueStore.getItem(parentUid);

        if (parentQueueItem?.type === NodeType.Folder && parentQueueItem.nodeUid) {
            return parentQueueItem.nodeUid;
        }

        return parentUid;
    }

    /**
     * Main scheduling loop that processes pending folders and files from the queue.
     * Respects concurrency limits and ensures folders are created before their contents.
     * Prevents concurrent scheduling runs.
     */
    private async schedule(): Promise<void> {
        void this.scheduleFolders();
        void this.scheduleUploads();
    }

    /**
     * Schedules pending folder creation operations up to the MAX_UPLOAD_FOLDER_LOAD limit.
     * Folders are processed depth-first to ensure parent folders are created before children.
     */
    private async scheduleFolders(): Promise<void> {
        if (this.isSchedulingFolders) {
            return;
        }

        this.isSchedulingFolders = true;

        try {
            while (this.activeFolders < MAX_UPLOAD_FOLDER_LOAD) {
                const folderItem = this.getNextQueuedFolder();
                if (!folderItem) {
                    break;
                }

                this.activeFolders++;
                void this.processFolderCreation(folderItem.uploadId, folderItem.item);
            }
        } finally {
            this.isSchedulingFolders = false;
        }
    }

    /**
     * Schedules pending file upload operations up to the MAX_UPLOAD_JOBS limit.
     * Only schedules files whose parent folders are ready.
     */
    private async scheduleUploads(): Promise<void> {
        if (this.isSchedulingFiles) {
            return;
        }

        this.isSchedulingFiles = true;

        try {
            while (this.activeUploads < MAX_UPLOAD_JOBS) {
                const fileItem = this.getNextQueuedFile();
                if (!fileItem) {
                    break;
                }

                this.activeUploads++;
                void this.processFileUpload(fileItem.uploadId, fileItem.item);
            }
        } finally {
            this.isSchedulingFiles = false;
        }
    }

    /**
     * Finds the next folder in the queue that's ready to be created.
     * Prioritizes folders by depth (shallower folders first) to ensure parent folders are created first.
     *
     * @returns The next folder to create, or null if none are ready
     */
    private getNextQueuedFolder(): { uploadId: string; item: FolderCreationItem } | null {
        const uploadQueueStore = useUploadQueueStore.getState();
        const allItems = uploadQueueStore.getQueue();

        const queuedFolders = allItems
            .filter((entry): entry is { uploadId: string; item: FolderCreationItem } => {
                return (
                    entry.item.type === NodeType.Folder &&
                    entry.item.status === UploadStatus.Pending &&
                    this.isParentFolderReady(entry.item)
                );
            })
            .sort((a, b) => {
                return this.getFolderDepth(a.item) - this.getFolderDepth(b.item);
            });

        return queuedFolders[0] || null;
    }

    /**
     * Finds the next file in the queue that's ready to be uploaded.
     * Only returns files whose parent folders have been created.
     *
     * @returns The next file to upload, or null if none are ready
     */
    private getNextQueuedFile(): { uploadId: string; item: FileUploadItem } | null {
        const queueStore = useUploadQueueStore.getState();
        const allItems = queueStore.getQueue();

        const readyFiles = allItems.filter((entry): entry is { uploadId: string; item: FileUploadItem } => {
            return (
                entry.item.type === NodeType.File &&
                entry.item.status === UploadStatus.Pending &&
                this.isParentFolderReady(entry.item)
            );
        });

        return readyFiles[0] || null;
    }

    /**
     * Checks if an item's parent folder is ready (created or doesn't need creation).
     *
     * @param item - The file or folder item to check
     * @returns True if the parent is ready, false if waiting for parent folder creation
     */
    private isParentFolderReady(item: FileUploadItem | FolderCreationItem): boolean {
        const uploadQueueStore = useUploadQueueStore.getState();
        const allItems = uploadQueueStore.getQueue();

        const parentByQueueId = allItems.find((entry) => entry.uploadId === item.parentUid);
        if (parentByQueueId && parentByQueueId.item.type === NodeType.Folder) {
            return !!parentByQueueId.item.nodeUid;
        }

        const parentByNodeUid = allItems.find((entry) => {
            return entry.item.type === NodeType.Folder && entry.item.nodeUid === item.parentUid;
        });

        if (!parentByNodeUid) {
            return true;
        }

        return (
            parentByNodeUid.item.status === UploadStatus.Finished ||
            (parentByNodeUid.item.type === NodeType.Folder && !!parentByNodeUid.item.nodeUid)
        );
    }

    /**
     * Calculates the depth of a folder in the upload hierarchy.
     * Used to prioritize shallower folders so parents are created before children.
     *
     * @param folder - The folder to calculate depth for
     * @returns The depth level (0 for root, 1 for direct children, etc.)
     */
    private getFolderDepth(folder: FolderCreationItem): number {
        const uploadQueueStore = useUploadQueueStore.getState();
        const allItems = uploadQueueStore.getQueue();

        let depth = 0;
        let currentParentUid = folder.parentUid;

        while (currentParentUid) {
            const parentFolder = allItems.find((entry) => {
                return entry.item.type === NodeType.Folder && entry.item.nodeUid === folder.parentUid;
            });

            if (!parentFolder || parentFolder.item.type !== NodeType.Folder) {
                break;
            }

            depth++;
            currentParentUid = parentFolder.item.parentUid;

            if (depth > 100) {
                break;
            }
        }

        return depth;
    }

    /**
     * Recursively cancels all child items of a folder.
     * Used when a folder creation fails or is cancelled.
     * Children are marked with ParentCancelled status to distinguish from user-initiated cancellations.
     *
     * @param folderId - The queue ID of the folder
     * @param folderNodeUid - The created node UID of the folder (if it was created)
     */
    private cancelFolderChildren(folderId: string, folderNodeUid?: string): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();
        const allItems = uploadQueueStore.getQueue();

        const childrenToCancel = allItems.filter(({ item: childItem }) => {
            return childItem.parentUid === folderId || (folderNodeUid && childItem.parentUid === folderNodeUid);
        });

        childrenToCancel.forEach(({ uploadId, item }) => {
            const storedController = controllerStore.getController(uploadId);
            if (storedController) {
                storedController.abortController.abort();
                controllerStore.removeController(uploadId);
            }
            uploadQueueStore.updateQueueItem(uploadId, {
                status: UploadStatus.ParentCancelled,
            });

            if (item.type === NodeType.Folder) {
                this.cancelFolderChildren(uploadId, item.nodeUid);
            }
        });
    }

    /**
     * Processes a single folder creation operation.
     * Handles conflict resolution and updates queue status.
     *
     * @param folderId - The queue ID of the folder
     * @param folder - The folder creation item
     */
    private async processFolderCreation(folderId: string, folder: FolderCreationItem): Promise<void> {
        const uploadQueueStore = useUploadQueueStore.getState();

        try {
            uploadQueueStore.updateQueueItem(folderId, { status: UploadStatus.InProgress });

            const actualParentUid = this.resolveParentUid(folder.parentUid);

            const nodeUid = await this.createFolder(
                folderId,
                folder.name,
                actualParentUid,
                folder.batchId,
                folder.modificationTime
            );

            if (nodeUid === null) {
                uploadQueueStore.updateQueueItem(folderId, { status: UploadStatus.Cancelled });
                this.cancelFolderChildren(folderId, folder.nodeUid);
            } else {
                uploadQueueStore.updateQueueItem(folderId, {
                    status: UploadStatus.Finished,
                    nodeUid,
                });
            }
        } catch (error) {
            uploadQueueStore.updateQueueItem(folderId, {
                status: UploadStatus.Failed,
                error: error instanceof Error ? error : new Error(c('Error').t`Folder creation failed`),
            });
            this.cancelFolderChildren(folderId, folder.nodeUid);

            handleSdkError(error);
        } finally {
            this.activeFolders--;
            void this.schedule();
        }
    }

    /**
     * Processes a single file upload operation.
     * Resolves the parent folder and initiates the upload.
     *
     * @param uploadId - The queue ID of the file
     * @param item - The file upload item
     */
    private async processFileUpload(uploadId: string, item: FileUploadItem): Promise<void> {
        const uploadQueueStore = useUploadQueueStore.getState();

        try {
            uploadQueueStore.updateQueueItem(uploadId, { status: UploadStatus.InProgress });

            const actualParentUid = this.resolveParentUid(item.parentUid);

            await startUpload(
                item.file,
                actualParentUid,
                (event) => this.onChangeCallback(uploadId, actualParentUid, event),
                (name, nodeType, conflictType) => this.resolveConflict(uploadId, name, nodeType, conflictType)
            );
        } catch (error) {
            uploadQueueStore.updateQueueItem(uploadId, {
                status: UploadStatus.Failed,
                error: error instanceof Error ? error : new Error(c('Error').t`Upload failed`),
            });

            handleSdkError(error);
        } finally {
            this.activeUploads--;
            void this.schedule();
        }
    }

    /**
     * Creates a folder
     * Handles conflict resolution when a folder with the same name exists.
     *
     * @param folderId - The queue ID of the folder
     * @param folderName - The name of the folder to create
     * @param parentUid - The parent node UID
     * @param batchId - The batch ID for conflict resolution
     * @param modificationTime - Optional modification time to preserve
     * @returns The created or resolved folder UID, or null if skipped
     */
    private async createFolder(
        folderId: string,
        folderName: string,
        parentUid: string,
        batchId: string,
        modificationTime?: Date
    ): Promise<string | null> {
        const drive = getDrive();
        try {
            const folder = await drive.createFolder(parentUid, folderName, modificationTime);
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
                    uploadQueueStore.updateQueueItem(folderId, {
                        status: UploadStatus.ConflictFound,
                        conflictType: UploadConflictType.Normal,
                        nodeType: NodeType.Folder,
                        resolve: (strategy: UploadConflictStrategy, applyToAll?: boolean) => {
                            if (applyToAll) {
                                uploadQueueStore.setBatchStrategy(strategy);
                            }
                            resolve(strategy);
                        },
                    });
                });

                if (strategy !== UploadConflictStrategy.Skip) {
                    uploadQueueStore.updateQueueItem(folderId, {
                        status: UploadStatus.InProgress,
                    });
                }

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

    /**
     * Applies the selected conflict resolution strategy for a folder.
     *
     * @param strategy - The strategy to apply (Replace, Rename, or Skip)
     * @param folderName - The name of the folder
     * @param parentUid - The parent node UID
     * @param existingFolderUid - The UID of the existing folder with the same name
     * @param _modificationTime - Optional modification time (for future Rename implementation)
     * @returns The folder UID to use, or null if skipped
     */
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

    /**
     * Callback for upload events from the SDK.
     * Updates queue state based on progress, errors, completion, and conflicts.
     *
     * @param uploadId - The queue ID of the upload
     * @param parentUid - The parent node UID
     * @param event - The upload event
     */
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
                    uploadQueueStore.updateQueueItem(uploadId, {
                        uploadedBytes: event.uploadedBytes,
                        status: UploadStatus.InProgress,
                    });
                }
                break;
            case UploadEventType.Error:
                const currentItem = uploadQueueStore.getItem(uploadId);
                if (currentItem?.status === UploadStatus.Cancelled) {
                    break;
                }

                const err = event.error instanceof Error ? event.error : new Error('Failed');
                uploadQueueStore.updateQueueItem(uploadId, {
                    status: UploadStatus.Failed,
                    error: err,
                });
                controllerStore.removeController(uploadId);
                this.checkAndUnsubscribeIfQueueEmpty();
                void this.schedule();
                handleSdkError(event.error);
                break;
            case UploadEventType.Complete:
                await actionEventManager.emit({
                    type: ActionEventName.CREATED_NODES,
                    items: [{ uid: event.nodeUid, parentUid }],
                });
                uploadQueueStore.updateQueueItem(uploadId, {
                    status: UploadStatus.Finished,
                });
                controllerStore.removeController(uploadId);
                this.checkAndUnsubscribeIfQueueEmpty();
                void this.schedule();
                break;
            case UploadEventType.Skip:
                uploadQueueStore.updateQueueItem(uploadId, {
                    status: UploadStatus.Skipped,
                });
                controllerStore.removeController(uploadId);
                this.checkAndUnsubscribeIfQueueEmpty();
                void this.schedule();
                break;
            case UploadEventType.ConflictFound:
                const uploadItem = uploadQueueStore.getItem(uploadId);
                if (!uploadItem) {
                    break;
                }
                if (!uploadQueueStore.activeConflictBatchId) {
                    uploadQueueStore.setActiveConflictBatch(uploadItem.batchId);
                }

                if (!uploadQueueStore.batchStrategy || uploadQueueStore.activeConflictBatchId !== uploadItem.batchId) {
                    uploadQueueStore.updateQueueItem(uploadId, {
                        status: UploadStatus.ConflictFound,
                    });
                }
                break;
        }
    }

    /**
     * Prompts the user to resolve a file upload conflict.
     * Returns the batch strategy if one is set, otherwise waits for user input.
     *
     * @param uploadId - The queue ID of the upload
     * @param name - The name of the conflicting item
     * @param nodeType - The type of node (file or folder)
     * @param conflictType - The type of conflict
     * @returns The selected conflict resolution strategy
     */
    private async resolveConflict(
        uploadId: string,
        name: string,
        nodeType: NodeType,
        conflictType: UploadConflictType
    ): Promise<UploadConflictStrategy> {
        const uploadQueueStore = useUploadQueueStore.getState();

        const uploadItem = uploadQueueStore.getItem(uploadId);
        if (!uploadItem) {
            throw new Error(c('Error').t`Upload not found`);
        }

        if (uploadQueueStore.batchStrategy && uploadQueueStore.activeConflictBatchId === uploadItem.batchId) {
            return uploadQueueStore.batchStrategy;
        }

        return new Promise<UploadConflictStrategy>((resolve) => {
            uploadQueueStore.updateQueueItem(uploadId, {
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

    /**
     * Initiates an upload of files to a specified parent folder.
     * Detects folder structures and queues files/folders appropriately.
     * Blocks if there are pending conflicts that need resolution.
     *
     * @param files - Array of File objects or FileList to upload
     * @param parentUid - The parent node UID where files should be uploaded
     */
    async upload(files: File[] | FileList, parentUid: string): Promise<void> {
        const uploadQueueStore = useUploadQueueStore.getState();

        const batchId = generateUID();

        if (!this.sdkEventsDisposer && uploadQueueStore.queue.size === 0) {
            this.subscribeToSDKEvents();
        }

        const filesArray = Array.from(files);
        const hasStructure = hasFolderStructure(filesArray);

        if (!hasStructure) {
            for (const file of filesArray) {
                uploadQueueStore.addItem({
                    type: NodeType.File,
                    file,
                    parentUid,
                    name: file.name,
                    uploadedBytes: 0,
                    clearTextExpectedSize: file.size,
                    status: UploadStatus.Pending,
                    batchId,
                });
            }
            void this.schedule();
            return;
        }

        const structure = buildFolderStructure(files);

        const folderMap = new Map<string, string>();

        const rootFolderId = uploadQueueStore.addItem({
            type: NodeType.Folder,
            name: structure.name,
            parentUid,
            status: UploadStatus.Pending,
            batchId,
        });

        folderMap.set('', rootFolderId);

        this.flattenAndQueueFolderStructure(structure, rootFolderId, '', batchId, folderMap);

        void this.schedule();
    }

    /**
     * Recursively flattens a folder structure tree and adds all folders/files to the queue.
     * Maintains a map of folder paths to queue IDs for parent references.
     *
     * @param node - The folder node to process
     * @param parentUid - The parent queue ID or node UID
     * @param currentPath - The current path in the folder structure
     * @param batchId - The batch ID for all items in this structure
     * @param folderMap - Map of folder paths to their queue IDs
     */
    private flattenAndQueueFolderStructure(
        node: FolderNode,
        parentUid: string,
        currentPath: string,
        batchId: string,
        folderMap: Map<string, string>
    ): void {
        const uploadQueueStore = useUploadQueueStore.getState();

        for (const [folderName, subfolder] of node.subfolders) {
            const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
            const folderId = uploadQueueStore.addItem({
                type: NodeType.Folder,
                name: folderName,
                parentUid,
                status: UploadStatus.Pending,
                batchId,
            });

            folderMap.set(folderPath, folderId);

            this.flattenAndQueueFolderStructure(subfolder, folderId, folderPath, batchId, folderMap);
        }

        for (const file of node.files) {
            const fileParentUid = currentPath ? folderMap.get(currentPath) || parentUid : parentUid;

            uploadQueueStore.addItem({
                type: NodeType.File,
                file,
                parentUid: fileParentUid,
                name: file.name,
                uploadedBytes: 0,
                clearTextExpectedSize: file.size,
                status: UploadStatus.Pending,
                batchId,
            });
        }
    }

    /**
     * Handles file uploads from drag-and-drop operations.
     * Processes DataTransferItemList and converts to files before uploading.
     *
     * @param items - The dropped items from a drag-and-drop event
     * @param parentUid - The parent node UID where files should be uploaded
     */
    async uploadDrop(items: DataTransferItemList, parentUid: string) {
        const files = await processDroppedItems(items);
        await this.upload(files, parentUid);
    }

    /**
     * Cancels a specific upload and all its children (if it's a folder).
     * Aborts any in-progress upload controllers.
     *
     * @param uploadId - The queue ID of the upload to cancel
     */
    cancelUpload(uploadId: string): void {
        const controllerStore = useUploadControllerStore.getState();
        const uploadQueueStore = useUploadQueueStore.getState();

        const item = uploadQueueStore.getItem(uploadId);
        if (!item) {
            console.warn(`Cannot cancel upload: item with uploadId ${uploadId} not found in queue`);
            return;
        }

        const storedController = controllerStore.getController(uploadId);
        if (storedController) {
            storedController.abortController.abort();
            controllerStore.removeController(uploadId);
        }
        uploadQueueStore.updateQueueItem(uploadId, { status: UploadStatus.Cancelled });

        if (item.type === NodeType.Folder) {
            this.cancelFolderChildren(uploadId, item.nodeUid);
        }
    }

    /**
     * Retries a failed or cancelled upload.
     * If the item has ParentCancelled status, finds and retries the parent folder first.
     * For folders, also retries all children with ParentCancelled status.
     *
     * @param uploadId - The queue ID of the upload to retry
     */
    retryUpload(uploadId: string): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const item = uploadQueueStore.getItem(uploadId);

        if (!item) {
            console.warn(`Cannot retry upload: item with uploadId ${uploadId} not found in queue`);
            return;
        }

        if (![UploadStatus.Failed, UploadStatus.Cancelled, UploadStatus.ParentCancelled].includes(item.status)) {
            console.warn(
                `Cannot retry upload: item ${uploadId} has status ${item.status}, expected Failed, Cancelled, or ParentCancelled`
            );
            return;
        }

        if (item.status === UploadStatus.ParentCancelled) {
            const parentFolder = this.findParentFolder(uploadId);
            if (parentFolder) {
                this.retryUpload(parentFolder.uploadId);
                return;
            }
            console.warn(`Cannot retry ParentCancelled upload: parent folder for ${uploadId} not found in queue`);
        }

        uploadQueueStore.updateQueueItem(uploadId, {
            status: UploadStatus.Pending,
            error: undefined,
            uploadedBytes: item.type === NodeType.File ? 0 : undefined,
        });

        if (item.type === NodeType.Folder) {
            this.retryFolderChildren(uploadId, item.nodeUid);
        }

        void this.schedule();
    }

    /**
     * Finds the parent folder of an item in the queue.
     * Uses the parentUid which is the uploadId of the parent folder in the queue.
     *
     * @param uploadId - The queue ID of the item
     * @returns The parent folder's uploadId and item, or undefined if not found
     */
    private findParentFolder(uploadId: string): { uploadId: string; item: FolderCreationItem } | undefined {
        const uploadQueueStore = useUploadQueueStore.getState();
        const item = uploadQueueStore.getItem(uploadId);

        if (!item) {
            console.warn(`Cannot find parent folder: item with uploadId ${uploadId} not found in queue`);
            return undefined;
        }

        const parentItem = uploadQueueStore.getItem(item.parentUid);

        if (parentItem && parentItem.type === NodeType.Folder) {
            return { uploadId: item.parentUid, item: parentItem };
        }

        console.warn(`Cannot find parent folder: parent ${item.parentUid} not found in queue or is not a folder`);
        return undefined;
    }

    /**
     * Recursively retries all children of a folder that have ParentCancelled status.
     * Only retries children that were cancelled due to parent failure.
     *
     * @param folderId - The queue ID of the folder
     * @param folderNodeUid - The created node UID of the folder (if it was created)
     */
    private retryFolderChildren(folderId: string, folderNodeUid?: string): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const allItems = uploadQueueStore.getQueue();

        const childrenToRetry = allItems.filter(({ item: childItem }) => {
            const isChild =
                childItem.parentUid === folderId || (folderNodeUid && childItem.parentUid === folderNodeUid);
            return isChild && childItem.status === UploadStatus.ParentCancelled;
        });

        childrenToRetry.forEach(({ uploadId, item }) => {
            uploadQueueStore.updateQueueItem(uploadId, {
                status: UploadStatus.Pending,
                error: undefined,
                uploadedBytes: item.type === NodeType.File ? 0 : undefined,
            });

            if (item.type === NodeType.Folder) {
                this.retryFolderChildren(uploadId, item.nodeUid);
            }
        });
    }

    /**
     * Removes completed or cancelled uploads from the queue.
     * Cleans up associated upload controllers.
     *
     * @param uploadIds - Array of upload IDs to remove
     */
    removeUploads(uploadIds: string[]): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();

        uploadIds.forEach((id) => controllerStore.removeController(id));
        uploadQueueStore.removeUploadItems(uploadIds);

        this.checkAndUnsubscribeIfQueueEmpty();
    }

    /**
     * Clears all uploads from the queue and cancels active uploads.
     * Unsubscribes from SDK events if subscribed.
     */
    clearUploadQueue(): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();

        controllerStore.clearAllControllers();
        uploadQueueStore.clearQueue();

        if (this.sdkEventsDisposer) {
            this.unsubscribeFromSDKEvents();
        }
    }

    /**
     * Gets the current upload queue capacity information.
     *
     * @returns Object containing active upload count and pause status
     */
    getCapacity(): {
        activeUploads: number;
        isAutomaticallyPaused: boolean;
    } {
        const uploadQueueStore = useUploadQueueStore.getState();
        return {
            activeUploads: uploadQueueStore.getQueue().length,
            isAutomaticallyPaused: this.isAutomaticallyPaused,
        };
    }

    /**
     * Checks if there are any active uploads in progress.
     *
     * @returns True if any uploads are in progress or paused by server
     */
    hasActiveUploads(): boolean {
        const uploadQueueStore = useUploadQueueStore.getState();
        const items = uploadQueueStore.getQueue();
        return items.some(
            ({ item }) => item.status === UploadStatus.InProgress || item.status === UploadStatus.PausedServer
        );
    }

    /**
     * Subscribes to SDK transfer pause/resume events.
     * Used to handle server-initiated pauses (e.g., storage quota reached).
     */
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

    /**
     * Unsubscribes from SDK transfer events.
     */
    private unsubscribeFromSDKEvents(): void {
        if (!this.sdkEventsDisposer) {
            return;
        }

        this.sdkEventsDisposer();
        this.sdkEventsDisposer = null;
    }

    /**
     * Handles the SDK TransfersPaused event.
     * Marks all in-progress uploads as paused by server.
     */
    private handleTransfersPaused(): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        this.isAutomaticallyPaused = true;

        const allItems = uploadQueueStore.getQueue();
        allItems.forEach(({ uploadId, item }) => {
            if (item.status === UploadStatus.InProgress) {
                uploadQueueStore.updateQueueItem(uploadId, { status: UploadStatus.PausedServer });
            }
        });
    }

    /**
     * Handles the SDK TransfersResumed event.
     * Resumes all paused uploads and marks them as in progress.
     */
    private handleTransfersResumed(): void {
        const uploadQueueStore = useUploadQueueStore.getState();
        this.isAutomaticallyPaused = false;

        const allItems = uploadQueueStore.getQueue();
        allItems.forEach(({ uploadId, item }) => {
            if (item.status === UploadStatus.PausedServer) {
                uploadQueueStore.updateQueueItem(uploadId, { status: UploadStatus.InProgress });
            }
        });
    }

    /**
     * Checks if all uploads are completed and unsubscribes from SDK events if so.
     * Called after uploads complete, fail, or are cancelled to clean up resources.
     */
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
