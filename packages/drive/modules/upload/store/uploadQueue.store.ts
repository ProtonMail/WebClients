import type { NodeType } from '@protontech/drive-sdk';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import generateUID from '@proton/utils/generateUID';

import {
    type FileUploadItem,
    type FolderCreationItem,
    type UploadConflictStrategy,
    type UploadConflictType,
    type UploadItem,
    UploadStatus,
} from '../types';

export type UploadItemConflict = UploadItem & {
    status: UploadStatus.ConflictFound;
    conflictType: UploadConflictType;
    nodeType: NodeType;
};

export type QueueEntry = UploadItem | UploadItemConflict;

export type UploadItemInput =
    | Omit<FileUploadItem, 'lastStatusUpdateTime' | 'uploadId'>
    | Omit<FolderCreationItem, 'lastStatusUpdateTime' | 'uploadId'>;

/**
 * Type guard to check if a QueueEntry is an UploadItemConflict.
 * An item is considered a conflict if it has ConflictFound status and has conflict metadata.
 *
 * @param item - The queue entry to check
 * @returns True if the item is an unresolved conflict, false otherwise
 */
export function isUploadItemConflict(item: QueueEntry): item is UploadItemConflict {
    return (
        item.status === UploadStatus.ConflictFound &&
        'conflictType' in item &&
        item.conflictType !== undefined &&
        'nodeType' in item &&
        item.nodeType !== undefined
    );
}

type QueueItemUpdate = {
    name?: string;
    modificationTime?: Date;
    status?: UploadStatus;
    uploadedBytes?: number;
    speedBytesPerSecond?: number;
    error?: Error;
    nodeUid?: string;
    thumbnailUrl?: string;
    conflictType?: UploadConflictType;
    nodeType?: NodeType;
    existingNodeUid?: string;
    isUnfinishedUpload?: boolean;
    resolvedStrategy?: UploadConflictStrategy;
};

type UploadQueueStore = {
    queue: Map<string, QueueEntry>;
    firstConflictItem: UploadItemConflict | null;

    /**
     * Adds a new upload item to the queue.
     *
     * @param item - The upload item to add (file or folder)
     * @returns The generated unique upload ID for this item
     */
    addItem: (item: UploadItemInput) => string;

    /**
     * Updates specific properties of a queue item.
     * Only mutable properties can be updated (status, progress, errors, etc.).
     * Immutable properties like name, file, batchId cannot be changed after creation.
     *
     * @param uploadId - The unique ID of the item to update
     * @param update - The properties to update
     */
    updateQueueItems: (uploadIds: string | string[], update: QueueItemUpdate) => void;

    /**
     * Retrieves all items in the queue as an array.
     *
     * @returns Array of objects containing uploadId and the queue item
     */
    getQueue: () => QueueEntry[];

    /**
     * Retrieves a specific item from the queue by its ID.
     *
     * @param uploadId - The unique ID of the item to retrieve
     * @returns The queue entry if found, undefined otherwise
     */
    getItem: (uploadId: string) => QueueEntry | undefined;

    /**
     * Removes multiple upload items from the queue.
     *
     * @param uploadIds - Array of upload IDs to remove
     */
    removeUploadItems: (uploadIds: string[]) => void;

    /**
     * Clears all items from the queue.
     */
    clearQueue: () => void;

    /**
     * Sets the first unresolved conflict item to show in the modal
     *
     * @param item - The conflict item to set, or null to clear
     */
    setFirstConflictItem: (item?: UploadItemConflict) => void;

    /**
     * Checks if there are any unresolved conflicts in the queue without a resolved strategy.
     *
     * @returns True if any item has status ConflictFound and no resolvedStrategy
     */
    getHasPendingConflicts: () => boolean;
};

export const useUploadQueueStore = create<UploadQueueStore>()(
    devtools(
        (set, get) => ({
            queue: new Map(),
            firstConflictItem: null,

            addItem: (item) => {
                const uploadId = generateUID();
                set((state) => ({
                    queue: new Map(state.queue).set(uploadId, { ...item, uploadId, lastStatusUpdateTime: new Date() }),
                }));
                return uploadId;
            },

            updateQueueItems: (uploadIds, update) => {
                set((state) => {
                    const queue = new Map(state.queue);
                    const idsArray = Array.isArray(uploadIds) ? uploadIds : [uploadIds];
                    for (const uploadId of idsArray) {
                        const existing = state.queue.get(uploadId);
                        if (!existing) {
                            continue;
                        }
                        const shouldUpdateTimestamp = update.status !== undefined && update.status !== existing.status;
                        const newQueueItem = {
                            ...existing,
                            ...update,
                            lastStatusUpdateTime: shouldUpdateTimestamp ? new Date() : existing.lastStatusUpdateTime,
                        };
                        queue.set(uploadId, newQueueItem);
                    }
                    return { queue };
                });
            },

            removeUploadItems: (uploadIds) => {
                set((state) => {
                    if (uploadIds.length === 0) {
                        return {};
                    }
                    const queue = new Map(state.queue);
                    uploadIds.forEach((id) => queue.delete(id));
                    return { queue };
                });
            },

            getQueue: () => {
                return Array.from(get().queue.values());
            },

            getItem: (uploadId) => get().queue.get(uploadId),

            clearQueue: () => {
                set({ queue: new Map(), firstConflictItem: null });
            },

            setFirstConflictItem: (item) => {
                set({ firstConflictItem: item });
            },

            getHasPendingConflicts: () => {
                return Array.from(get().queue.values()).some(
                    (item) => item.status === UploadStatus.ConflictFound && !item.resolvedStrategy
                );
            },
        }),
        { name: 'UploadQueueStore' }
    )
);
