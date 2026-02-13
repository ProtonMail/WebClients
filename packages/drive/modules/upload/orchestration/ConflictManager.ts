import { c } from 'ttag';

import { NodeType, NodeWithSameNameExistsValidationError } from '../../../index';
import { UploadDriveClientRegistry } from '../UploadDriveClientRegistry';
import { useUploadQueueStore } from '../store/uploadQueue.store';
import type { FileUploadItem, FolderCreationItem } from '../types';
import { UploadConflictStrategy, UploadConflictType, UploadStatus, isPhotosUploadItem } from '../types';
import { getBlockedChildren } from '../utils/dependencyHelpers';

type ResolutionResult =
    | { action: UploadConflictStrategy.Skip }
    | { action: UploadConflictStrategy.Replace; existingNodeUid?: string; isUnfinishedUpload?: boolean }
    | { action: UploadConflictStrategy.Rename; newName: string };

const getConflictType = (error: NodeWithSameNameExistsValidationError): UploadConflictType => {
    return error.isUnfinishedUpload ? UploadConflictType.Draft : UploadConflictType.Normal;
};

const getResolutionData = async (
    name: string,
    parentUid: string,
    error: NodeWithSameNameExistsValidationError,
    strategy: UploadConflictStrategy
): Promise<ResolutionResult> => {
    switch (strategy) {
        case UploadConflictStrategy.Skip:
            return { action: UploadConflictStrategy.Skip };
        case UploadConflictStrategy.Replace:
            return {
                action: UploadConflictStrategy.Replace,
                existingNodeUid: error.existingNodeUid,
                isUnfinishedUpload: error.isUnfinishedUpload,
            };
        case UploadConflictStrategy.Rename:
            const drive = UploadDriveClientRegistry.getDriveClient();
            const availableName = await drive.getAvailableName(parentUid, name);
            return { action: UploadConflictStrategy.Rename, newName: availableName };
        default:
            throw new Error(c('Error').t`Unknown conflict strategy: ${strategy}`);
    }
};

/**
 * Manages conflict detection and resolution for uploads
 * Handles batch strategies and conflict resolution workflows
 */
export class ConflictManager {
    private batchConflictStrategies = new Map<string, Map<NodeType, UploadConflictStrategy>>();
    private conflictResolver?: (
        name: string,
        nodeType: NodeType,
        conflictType: UploadConflictType
    ) => Promise<{ strategy: UploadConflictStrategy; applyToAll: boolean }>;
    private resolutionInProgress: Promise<void> | null = null;

    constructor(private onQueueEmptyCheck: () => void) {}

    setConflictResolver(
        callback: (
            name: string,
            nodeType: NodeType,
            conflictType: UploadConflictType
        ) => Promise<{ strategy: UploadConflictStrategy; applyToAll: boolean }>
    ): void {
        this.conflictResolver = callback;
    }

    removeConflictResolver(): void {
        this.conflictResolver = undefined;
    }

    /**
     * Handle conflict - calls conflict resolver if set, otherwise defaults to Rename
     */
    async handleConflict(uploadId: string, error: NodeWithSameNameExistsValidationError): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        const item = queueStore.getItem(uploadId);
        if (!item || isPhotosUploadItem(item)) {
            return;
        }

        const batchStrategies = this.batchConflictStrategies.get(item.batchId);
        const batchStrategy = batchStrategies?.get(item.type);
        if (batchStrategy) {
            await this.retryWithStrategy(uploadId, item, error, batchStrategy);
            return;
        }

        const conflictType = getConflictType(error);
        queueStore.updateQueueItems(uploadId, {
            status: UploadStatus.ConflictFound,
            error,
            conflictType,
            nodeType: item.type,
            resolvedStrategy: undefined,
        });

        if (this.resolutionInProgress) {
            await this.resolutionInProgress;

            const updatedItem = queueStore.getItem(uploadId);
            if (!updatedItem || isPhotosUploadItem(updatedItem)) {
                return;
            }

            if (updatedItem.status !== UploadStatus.ConflictFound) {
                return;
            }

            if (!updatedItem.error || !(updatedItem.error instanceof NodeWithSameNameExistsValidationError)) {
                return;
            }

            const batchStrategiesAfterWait = this.batchConflictStrategies.get(updatedItem.batchId);
            const batchStrategyAfterWait = batchStrategiesAfterWait?.get(updatedItem.type);
            if (batchStrategyAfterWait) {
                await this.retryWithStrategy(uploadId, updatedItem, updatedItem.error, batchStrategyAfterWait);
                return;
            }
        }

        if (this.conflictResolver) {
            this.resolutionInProgress = (async () => {
                try {
                    const { strategy, applyToAll } = await this.conflictResolver!(item.name, item.type, conflictType);

                    await this.chooseConflictStrategy(uploadId, strategy);

                    if (applyToAll) {
                        this.setBatchStrategy(item.batchId, item.type, strategy);

                        const uploadIds = Array.from(queueStore.queue.values())
                            .filter(
                                (queueItem) =>
                                    queueItem.status === UploadStatus.ConflictFound &&
                                    !queueItem.resolvedStrategy &&
                                    queueItem.batchId === item.batchId &&
                                    queueItem.type === item.type &&
                                    queueItem.uploadId !== uploadId
                            )
                            .map((queueItem) => queueItem.uploadId);

                        for (const id of uploadIds) {
                            await this.chooseConflictStrategy(id, strategy);
                        }
                    }
                } finally {
                    this.resolutionInProgress = null;
                }
            })();

            await this.resolutionInProgress;
        } else {
            await this.chooseConflictStrategy(uploadId, UploadConflictStrategy.Rename);
        }
    }

    /**
     * Retry with resolved conflict strategy
     */
    private async retryWithStrategy(
        uploadId: string,
        item: FileUploadItem | FolderCreationItem,
        error: NodeWithSameNameExistsValidationError,
        strategy: UploadConflictStrategy
    ): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        const isFolder = item.type === NodeType.Folder;

        try {
            const resolution = await getResolutionData(item.name, item.parentUid, error, strategy);
            switch (resolution.action) {
                case UploadConflictStrategy.Skip:
                    queueStore.updateQueueItems(uploadId, {
                        status: UploadStatus.Skipped,
                    });
                    if (isFolder) {
                        this.cancelFolderChildren(uploadId);
                    }
                    break;
                case UploadConflictStrategy.Rename:
                    queueStore.updateQueueItems(uploadId, {
                        name: resolution.newName,
                        status: UploadStatus.Pending,
                        existingNodeUid: undefined,
                        isUnfinishedUpload: undefined,
                        nodeUid: undefined,
                        resolvedStrategy: undefined,
                        error: undefined,
                        conflictType: undefined,
                    });
                    break;
                case UploadConflictStrategy.Replace:
                    queueStore.updateQueueItems(uploadId, {
                        status: isFolder ? UploadStatus.Finished : UploadStatus.Pending,
                        existingNodeUid: resolution.existingNodeUid,
                        isUnfinishedUpload: resolution.isUnfinishedUpload,
                        nodeUid: isFolder ? resolution.existingNodeUid : undefined,
                    });
                    if (isFolder && resolution.existingNodeUid) {
                        const allItems = queueStore.getQueue();
                        const childrenIds = getBlockedChildren(uploadId, allItems);
                        for (const childId of childrenIds) {
                            queueStore.updateQueueItems(childId, {
                                parentUid: resolution.existingNodeUid,
                            });
                        }
                    }
                    break;
            }
        } catch (err) {
            queueStore.updateQueueItems(uploadId, {
                status: UploadStatus.Failed,
                error: err instanceof Error ? err : new Error('Conflict resolution failed'),
            });
            if (isFolder) {
                this.cancelFolderChildren(uploadId);
            }
        } finally {
            this.onQueueEmptyCheck();
        }
    }

    /**
     * Set conflict resolution strategy for a specific node type in a batch
     * Future conflicts of the same type in this batch will automatically use this strategy
     */
    setBatchStrategy(batchId: string, nodeType: NodeType, strategy: UploadConflictStrategy): void {
        if (!this.batchConflictStrategies.has(batchId)) {
            this.batchConflictStrategies.set(batchId, new Map());
        }
        this.batchConflictStrategies.get(batchId)!.set(nodeType, strategy);
    }

    /**
     * Clear batch strategy when batch is complete
     */
    clearBatchStrategy(batchId: string): void {
        this.batchConflictStrategies.delete(batchId);
    }

    /**
     * Choose a conflict for a specific item
     * Called from uploadManager.chooseConflictStrategy()
     */
    async chooseConflictStrategy(uploadId: string, strategy: UploadConflictStrategy): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        const item = queueStore.getItem(uploadId);

        if (
            !item ||
            item.status !== UploadStatus.ConflictFound ||
            !item.error ||
            !(item.error instanceof NodeWithSameNameExistsValidationError) ||
            isPhotosUploadItem(item)
        ) {
            return;
        }

        await this.retryWithStrategy(uploadId, item, item.error, strategy);
    }

    /**
     * Cancel all children of a failed/skipped folder
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
}
