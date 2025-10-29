import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { NodeType } from '@proton/drive';
import generateUID from '@proton/utils/generateUID';

import { BaseTransferStatus } from '../download/downloadManager.store';
import type { UploadConflictStrategy, UploadConflictType } from './types';

export enum UploadStatus {
    Pending = BaseTransferStatus.Pending,
    InProgress = BaseTransferStatus.InProgress,
    Finished = BaseTransferStatus.Finished,
    Failed = BaseTransferStatus.Failed,
    Cancelled = BaseTransferStatus.Cancelled,
    ParentCancelled = 'parentCancelled',
    Skipped = 'skipped',
    ConflictFound = 'conflictFound',
    PausedServer = BaseTransferStatus.PausedServer,
}

export type BaseUploadItem = {
    name: string;
    status: UploadStatus;
    batchId: string;
    error?: Error;
};

export type FileUploadItem = BaseUploadItem & {
    type: NodeType.File;
    file: File;
    parentUid: string;
    uploadedBytes: number;
    clearTextExpectedSize: number;
    thumbnailUrl?: string;
    speedBytesPerSecond?: number;
};

export type FolderCreationItem = BaseUploadItem & {
    type: NodeType.Folder;
    parentUid: string;
    nodeUid?: string;
    modificationTime?: Date;
};

export type UploadItem = FileUploadItem | FolderCreationItem;

export type FileConflictItem = FileUploadItem & {
    status: UploadStatus.ConflictFound;
    conflictType: UploadConflictType;
    nodeType: NodeType;
    resolve: (strategy: UploadConflictStrategy, applyToAll?: boolean) => void;
};

export type FolderConflictItem = FolderCreationItem & {
    status: UploadStatus.ConflictFound;
    conflictType: UploadConflictType;
    nodeType: NodeType;
    resolve: (strategy: UploadConflictStrategy, applyToAll?: boolean) => void;
};

export type UploadItemConflict = FileConflictItem | FolderConflictItem;

export type QueueEntry = UploadItem | UploadItemConflict;

function isConflictItem(item: QueueEntry): item is UploadItemConflict {
    return item.status === UploadStatus.ConflictFound;
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
    resolve?: (strategy: UploadConflictStrategy, applyToAll?: boolean) => void;
};

type UploadQueueStore = {
    queue: Map<string, QueueEntry>;
    activeConflictBatchId: string | null;
    batchStrategy: UploadConflictStrategy | null;

    /**
     * Adds a new upload item to the queue.
     *
     * @param item - The upload item to add (file or folder)
     * @returns The generated unique upload ID for this item
     */
    addItem: (item: UploadItem) => string;

    /**
     * Updates specific properties of a queue item.
     * Only mutable properties can be updated (status, progress, errors, etc.).
     * Immutable properties like name, file, batchId cannot be changed after creation.
     *
     * @param uploadId - The unique ID of the item to update
     * @param update - The properties to update
     */
    updateQueueItem: (uploadId: string, update: QueueItemUpdate) => void;

    /**
     * Retrieves all items in the queue as an array.
     *
     * @returns Array of objects containing uploadId and the queue item
     */
    getQueue: () => { uploadId: string; item: QueueEntry }[];

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
     * Sets the active conflict batch ID to control which batch's conflicts are shown in the UI.
     * Only one batch can be in conflict resolution mode at a time.
     *
     * @param batchId - The batch ID to set as active
     */
    setActiveConflictBatch: (batchId: string) => void;

    /**
     * Sets the conflict resolution strategy to apply to all items in the current batch.
     * Used when user checks "apply to all" in the conflict resolution dialog.
     *
     * @param strategy - The strategy to apply (Replace, Rename, or Skip)
     */
    setBatchStrategy: (strategy: UploadConflictStrategy) => void;

    /**
     * Clears the active conflict batch and its associated batch strategy.
     * Called when all conflicts in a batch have been resolved.
     */
    clearActiveConflictBatch: () => void;

    /**
     * Checks if there are any unresolved conflicts in the queue.
     *
     * @returns True if any item has status ConflictFound
     */
    hasPendingConflicts: () => boolean;

    /**
     * Gets the first conflict item in the queue that needs resolution.
     * Used to show the next conflict to the user.
     *
     * @returns The first conflict item found, or undefined if no conflicts exist
     */
    getFirstPendingConflict: () => UploadItemConflict | undefined;
};

export const useUploadQueueStore = create<UploadQueueStore>()(
    devtools(
        (set, get) => ({
            queue: new Map(),
            activeConflictBatchId: null,
            batchStrategy: null,

            addItem: (item) => {
                const uploadId = generateUID();
                set((state) => ({
                    queue: new Map(state.queue).set(uploadId, item),
                }));
                return uploadId;
            },

            updateQueueItem: (uploadId, update) => {
                set((state) => {
                    const existing = state.queue.get(uploadId);
                    if (!existing) {
                        return {};
                    }
                    const queue = new Map(state.queue);
                    queue.set(uploadId, { ...existing, ...update });
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
                return Array.from(get().queue.entries()).map(([uploadId, item]) => {
                    return { uploadId, item };
                });
            },

            getItem: (uploadId) => get().queue.get(uploadId),

            clearQueue: () => {
                set({ queue: new Map() });
            },

            setActiveConflictBatch: (batchId) => {
                set({ activeConflictBatchId: batchId });
            },

            setBatchStrategy: (strategy) => {
                set({ batchStrategy: strategy });
            },

            clearActiveConflictBatch: () => {
                set({ activeConflictBatchId: null, batchStrategy: null });
            },

            hasPendingConflicts: () => {
                return Array.from(get().queue.values()).some((item) => item.status === UploadStatus.ConflictFound);
            },

            getFirstPendingConflict: () => {
                return Array.from(get().queue.values()).find(isConflictItem);
            },
        }),
        { name: 'UploadQueueStore' }
    )
);
