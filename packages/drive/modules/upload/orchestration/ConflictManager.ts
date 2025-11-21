import { c } from 'ttag';

import { NodeType, NodeWithSameNameExistsValidationError, getDrive } from '../../../index';
import { isUploadItemConflict, useUploadQueueStore } from '../store/uploadQueue.store';
import type { FileUploadItem, FolderCreationItem } from '../types';
import { UploadConflictStrategy, UploadConflictType, UploadStatus } from '../types';
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
            const drive = getDrive();
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
    constructor(private onQueueEmptyCheck: () => void) {}

    /**
     * Finds and sets the next unresolved conflict as firstConflictItem.
     * This updates the UI to show the next conflict modal after resolving the current one.
     * Scans the queue for items with ConflictFound status and no resolvedStrategy.
     */
    private updateFirstConflictItem(): void {
        const queueStore = useUploadQueueStore.getState();
        const allItems = queueStore.getQueue();

        const nextConflict = allItems.find(
            (item) => item.status === UploadStatus.ConflictFound && !item.resolvedStrategy
        );

        if (nextConflict && isUploadItemConflict(nextConflict)) {
            queueStore.setFirstConflictItem(nextConflict);
        } else {
            queueStore.setFirstConflictItem(undefined);
        }
    }

    /**
     * Handle conflict - set item to ConflictFound status
     * Resolution happens later via resolveConflictForItem
     */
    async handleConflict(uploadId: string, error: NodeWithSameNameExistsValidationError): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        const item = queueStore.getItem(uploadId);
        if (!item) {
            return;
        }

        const conflictType = getConflictType(error);
        queueStore.updateQueueItems(uploadId, {
            status: UploadStatus.ConflictFound,
            error,
            conflictType,
            nodeType: item.type,
        });

        if (!queueStore.firstConflictItem) {
            const updatedItem = queueStore.getItem(uploadId);
            if (updatedItem && isUploadItemConflict(updatedItem)) {
                queueStore.setFirstConflictItem(updatedItem);
            }
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
            !(item.error instanceof NodeWithSameNameExistsValidationError)
        ) {
            return;
        }

        await this.retryWithStrategy(uploadId, item, item.error, strategy);

        this.updateFirstConflictItem();
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
