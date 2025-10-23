import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { NodeType } from '@proton/drive';
import generateUID from '@proton/utils/generateUID';

import { BaseTransferStatus } from '../download/downloadManager.store';
import type { UploadConflictStrategy, UploadConflictType } from './types';

export enum UploadStatus {
    InProgress = BaseTransferStatus.InProgress,
    Failed = BaseTransferStatus.Failed,
    PausedServer = BaseTransferStatus.PausedServer,
    Finished = BaseTransferStatus.Finished,
    Pending = BaseTransferStatus.Pending,
    Cancelled = BaseTransferStatus.Cancelled,
    ConflictFound = 'conflictFound',
}

type BaseUploadItem = {
    name: string;
    uploadedBytes: number;
    clearTextExpectedSize: number;
    thumbnailUrl?: string;
    speedBytesPerSecond?: number;
    batchId: string;
};

export type UploadItemConflict = BaseUploadItem & {
    status: UploadStatus.ConflictFound;
    conflictType: UploadConflictType;
    nodeType: NodeType;
    resolve: (strategy: UploadConflictStrategy, applyToAll?: boolean) => void;
};

export type UploadItem =
    | (BaseUploadItem &
          (
              | { status: UploadStatus.Pending }
              | { status: UploadStatus.InProgress }
              | { status: UploadStatus.PausedServer }
              | { status: UploadStatus.Failed; error: Error }
              | { status: UploadStatus.Cancelled }
              | { status: UploadStatus.Finished }
          ))
    | UploadItemConflict;

type UploadQueueStore = {
    queue: Map<string, UploadItem>;
    activeConflictBatchId: string | null;
    batchStrategy: UploadConflictStrategy | null;

    addUploadItem: (item: UploadItem) => string;
    updateUploadItem: (uploadId: string, update: any) => void;
    removeUploadItems: (uploadIds: string[]) => void;
    clearQueue: () => void;
    getQueue: () => { uploadId: string; item: UploadItem }[];
    getQueueItem: (uploadId: string) => UploadItem | undefined;

    setActiveConflictBatch: (batchId: string) => void;
    setBatchStrategy: (strategy: UploadConflictStrategy) => void;
    clearActiveConflictBatch: () => void;
    hasPendingConflicts: () => boolean;
    getFirstPendingConflict: () => UploadItemConflict | undefined;
};

export const useUploadQueueStore = create<UploadQueueStore>()(
    devtools(
        (set, get) => ({
            queue: new Map(),
            activeConflictBatchId: null,
            batchStrategy: null,

            addUploadItem: (item: UploadItem) => {
                const uploadId = generateUID();
                set((state) => ({
                    queue: new Map(state.queue).set(uploadId, item),
                }));
                return uploadId;
            },

            updateUploadItem: (uploadId, update) => {
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

            getQueueItem: (uploadId) => get().queue.get(uploadId),

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

            getFirstPendingConflict: () =>
                Array.from(get().queue.values()).find((item) => item.status === UploadStatus.ConflictFound),
        }),
        { name: 'UploadQueueStore' }
    )
);
