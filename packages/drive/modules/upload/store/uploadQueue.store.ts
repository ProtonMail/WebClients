import type { NodeType } from '@protontech/drive-sdk';
import { create } from 'zustand';

import {
    type FileUploadItem,
    type FolderCreationItem,
    type PhotosUploadItem,
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
    | Omit<FileUploadItem, 'lastStatusUpdateTime'>
    | Omit<FolderCreationItem, 'lastStatusUpdateTime'>
    | Omit<PhotosUploadItem, 'lastStatusUpdateTime'>;

type QueueItemUpdate = {
    name?: string;
    modificationTime?: Date;
    status?: UploadStatus;
    uploadedBytes?: number;
    speedBytesPerSecond?: number;
    error?: Error;
    nodeUid?: string;
    parentUid?: string;
    thumbnailUrl?: string;
    conflictType?: UploadConflictType;
    nodeType?: NodeType;
    existingNodeUid?: string;
    isUnfinishedUpload?: boolean;
    resolvedStrategy?: UploadConflictStrategy;
};

type UploadQueueStore = {
    queue: Map<string, QueueEntry>;

    /**
     * Adds multiple upload items to the queue in a single state update.
     *
     * @param items - The upload items to add, each already carrying its own `uploadId`.
     * Callers generate the ID themselves so they can reference an item (e.g. as a parent)
     * while still building the batch, before it is inserted.
     */
    addItems: (items: UploadItemInput[]) => void;

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
     * Checks if there are any unresolved conflicts in the queue without a resolved strategy.
     *
     * @returns True if any item has status ConflictFound and no resolvedStrategy
     */
    getHasPendingConflicts: () => boolean;
};

export const useUploadQueueStore = create<UploadQueueStore>()((set, get) => ({
    queue: new Map(),

    addItems: (items) => {
        const now = new Date();
        set((state) => {
            const queue = new Map(state.queue);
            for (const item of items) {
                queue.set(item.uploadId, { ...item, lastStatusUpdateTime: now });
            }
            return { queue };
        });
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
        set({ queue: new Map() });
    },

    getHasPendingConflicts: () => {
        return Array.from(get().queue.values()).some(
            (item) => item.status === UploadStatus.ConflictFound && !item.resolvedStrategy
        );
    },
}));
