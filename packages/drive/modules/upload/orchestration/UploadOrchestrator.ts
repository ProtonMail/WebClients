import { NodeType } from '@protontech/drive-sdk';

import { UploadDriveClientRegistry } from '../UploadDriveClientRegistry';
import { MAX_FOLDERS_CREATED_IN_PARALLEL, MAX_UPLOAD_JOBS } from '../constants';
import { FileUploadExecutor } from '../execution/FileUploadExecutor';
import { FolderCreationExecutor } from '../execution/FolderCreationExecutor';
import { PhotosUploadExecutor } from '../execution/PhotosUploadExecutor';
import { CapacityManager } from '../scheduling/CapacityManager';
import { useUploadQueueStore } from '../store/uploadQueue.store';
import type { UploadEvent, UploadTask } from '../types';
import { type UploadConflictStrategy, type UploadConflictType, UploadStatus, isPhotosUploadItem } from '../types';
import { getBlockedChildren } from '../utils/dependencyHelpers';
import { getNextTasks } from '../utils/schedulerHelpers';
import { uploadLogDebug } from '../utils/uploadLogger';
import { ConflictManager } from './ConflictManager';
import { SDKTransferActivity } from './SDKTransferActivity';
import { UploadEventHandler } from './UploadEventHandler';

/**
 * Orchestrates uploads using event-driven architecture
 * ONLY component with store access
 * Coordinates execution, conflict resolution, and SDK events
 */
export class UploadOrchestrator {
    private isRunning = false;
    private shouldStop = false;

    private capacityManager = new CapacityManager();
    private fileExecutor = new FileUploadExecutor();
    private folderExecutor = new FolderCreationExecutor();
    private photosExecutor = new PhotosUploadExecutor();

    private sdkTransferActivity = new SDKTransferActivity();
    private sdkPhotosTransferActivity = new SDKTransferActivity();
    private conflictManager = new ConflictManager(() => {
        this.sdkTransferActivity.checkAndUnsubscribeIfQueueEmpty();
        this.sdkPhotosTransferActivity.checkAndUnsubscribeIfQueueEmpty();
    });
    private eventHandler = new UploadEventHandler(
        this.capacityManager,
        this.conflictManager,
        this.sdkTransferActivity,
        this.sdkPhotosTransferActivity,
        (uploadId) => this.cancelFolderChildren(uploadId)
    );

    constructor() {
        this.fileExecutor.setEventCallback((event) => this.eventHandler.handleEvent(event));
        this.folderExecutor.setEventCallback((event) => this.eventHandler.handleEvent(event));
        this.photosExecutor.setEventCallback((event) => this.eventHandler.handleEvent(event));
    }

    subscribeToEvents(context: string, callback: (event: UploadEvent) => Promise<void>): () => void {
        return this.eventHandler.subscribeToEvents(context, callback);
    }

    hasSubscriptions(): boolean {
        return this.eventHandler.hasSubscriptions();
    }

    setConflictResolver(
        callback: (
            name: string,
            nodeType: NodeType,
            conflictType: UploadConflictType
        ) => Promise<{ strategy: UploadConflictStrategy; applyToAll: boolean }>
    ): void {
        this.conflictManager.setConflictResolver(callback);
    }

    removeConflictResolver(): void {
        this.conflictManager.removeConflictResolver();
    }

    emitFileQueued(uploadId: string, isForPhotos: boolean, abortController: AbortController): void {
        void this.eventHandler.handleEvent({
            type: 'file:queued',
            uploadId,
            isForPhotos,
            abortController,
        });
    }

    /**
     * Main orchestration loop
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        const queueStore = useUploadQueueStore.getState();
        const haveQueuedItems = queueStore.getQueue().length > 0;

        const needDriveClientSubscribe =
            haveQueuedItems &&
            queueStore.getQueue().some((queue) => queue.type === NodeType.File || queue.type === NodeType.Folder) &&
            !this.sdkTransferActivity.isSubscribed();
        if (needDriveClientSubscribe) {
            this.sdkTransferActivity.subscribe(UploadDriveClientRegistry.getDriveClient());
        }

        const needDrivePhotosClientSubscribe =
            haveQueuedItems &&
            queueStore.getQueue().some((queue) => queue.type === NodeType.Photo) &&
            !this.sdkPhotosTransferActivity.isSubscribed();
        if (needDrivePhotosClientSubscribe) {
            this.sdkPhotosTransferActivity.subscribe(UploadDriveClientRegistry.getDrivePhotosClient());
        }

        this.isRunning = true;
        this.shouldStop = false;

        while (!this.shouldStop) {
            const queueItems = queueStore.getQueue();
            const currentLoad = this.capacityManager.getCurrentLoad();

            const tasks = getNextTasks(queueItems, currentLoad, MAX_UPLOAD_JOBS, MAX_FOLDERS_CREATED_IN_PARALLEL);

            if (tasks.length === 0) {
                const hasActive = this.hasActiveUploads();
                const hasMore = queueItems.some(
                    (item) =>
                        item.status === UploadStatus.Pending ||
                        item.status === UploadStatus.InProgress ||
                        item.status === UploadStatus.Preparing ||
                        item.status === UploadStatus.Waiting ||
                        item.status === UploadStatus.ConflictFound
                );

                if (hasActive || hasMore) {
                    await this.waitForCapacity();
                    continue;
                } else {
                    this.sdkPhotosTransferActivity.unsubscribe();
                    this.sdkTransferActivity.unsubscribe();
                    break;
                }
            }

            uploadLogDebug('Picked tasks', {
                count: tasks.length,
                ids: tasks.map((t) => t.uploadId),
                activePreparingFiles: this.capacityManager.getCurrentLoad().activePreparingFiles,
            });

            void this.executeTasksBatch(tasks);

            await this.waitForCapacity();
        }

        this.isRunning = false;
    }

    /**
     * Execute multiple tasks in parallel
     */
    private async executeTasksBatch(tasks: UploadTask[]): Promise<void> {
        const promises = tasks.map((task) => this.executeTask(task));
        await Promise.allSettled(promises);
    }

    /**
     * Execute a single task
     */
    private async executeTask(task: UploadTask): Promise<void> {
        if (task.type === NodeType.Folder) {
            this.capacityManager.reserveFolder();
        } else {
            this.capacityManager.reservePreparing(task.uploadId);
        }

        uploadLogDebug('executeTask start', {
            uploadId: task.uploadId,
            name: task.name,
            activePreparingFilesAfterReserve: this.capacityManager.getCurrentLoad().activePreparingFiles,
        });

        try {
            await this.eventHandler.handleEvent({
                type: 'file:preparing',
                uploadId: task.uploadId,
                isForPhotos: task.type === NodeType.Photo,
            });

            if (task.type === NodeType.Folder) {
                await this.folderExecutor.execute(task);
            } else if (task.isForPhotos) {
                await this.photosExecutor.execute(task);
            } else {
                await this.fileExecutor.execute(task);
            }
        } finally {
            if (task.type === NodeType.Folder) {
                this.capacityManager.releaseFolder();
            } else {
                this.capacityManager.releaseFile(task.uploadId);
            }
        }
    }

    /**
     * Cancel all children of a failed folder
     */
    private cancelFolderChildren(uploadId: string): void {
        const queueStore = useUploadQueueStore.getState();
        const allItems = queueStore.getQueue();

        const childrenIds = getBlockedChildren(uploadId, allItems);

        childrenIds.forEach((childId) => {
            queueStore.updateQueueItems(childId, {
                status: UploadStatus.ParentCancelled,
            });
        });
    }

    /**
     * Checks if there are any uploads currently in progress
     */
    private hasActiveUploads(): boolean {
        const load = this.capacityManager.getCurrentLoad();
        return load.activePreparingFiles > 0 || load.activeUploadingFiles > 0 || load.activeFolders > 0;
    }

    /**
     * Waits for a short interval to allow async operations to complete.
     * This prevents tight loops while waiting for uploads to finish or conflicts to be resolved.
     * The 100ms interval is a balance between responsiveness and CPU usage.
     */
    private async waitForCapacity(): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, 100));
    }

    /**
     * Choose conflict for item(s)
     */
    async chooseConflictStrategy(uploadIds: string | string[], strategy: UploadConflictStrategy): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        queueStore.updateQueueItems(uploadIds, {
            resolvedStrategy: strategy,
        });

        const idsArray = Array.isArray(uploadIds) ? uploadIds : [uploadIds];

        // TODO: Check if we can do Promise.all()
        for (const uploadId of idsArray) {
            await this.conflictManager.chooseConflictStrategy(uploadId, strategy);
        }
    }

    /**
     * Cancel an upload
     * Emits cancel event for proper cleanup
     */
    async cancel(uploadId: string): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        const item = queueStore.getItem(uploadId);

        if (!item) {
            return;
        }

        if (item.type === NodeType.File || item.type === NodeType.Photo) {
            await this.eventHandler.handleEvent({
                type: 'file:cancelled',
                uploadId,
                isForPhotos: isPhotosUploadItem(item),
            });
        } else {
            await this.eventHandler.handleEvent({
                type: 'folder:cancelled',
                uploadId,
            });
        }
    }

    stop(): void {
        this.shouldStop = true;
    }

    reset(): void {
        this.capacityManager.reset();
        this.sdkTransferActivity.unsubscribe();
        this.sdkPhotosTransferActivity.unsubscribe();
    }
}
