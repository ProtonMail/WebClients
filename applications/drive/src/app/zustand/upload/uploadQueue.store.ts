import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import generateUID from '@proton/utils/generateUID';

import { BaseTransferStatus } from '../download/downloadManager.store';

export enum UploadStatus {
    InProgress = BaseTransferStatus.InProgress,
    Failed = BaseTransferStatus.Failed,
    PausedServer = BaseTransferStatus.PausedServer,
    Finished = BaseTransferStatus.Finished,
    Pending = BaseTransferStatus.Pending,
    Cancelled = BaseTransferStatus.Cancelled,
    ConflictFound = 'conflictFound',
}

export type UploadItem = {
    name: string;
    progress: number;
    thumbnailUrl?: string;
    error?: Error;
    speedBytesPerSecond?: number;
    status: UploadStatus;
};

type UploadQueueStore = {
    queue: Map<string, UploadItem>;

    addUploadItem: (item: UploadItem) => string;
    updateUploadItem: (uploadId: string, update: Partial<UploadItem>) => void;
    removeUploadItems: (uploadIds: string[]) => void;
    clearQueue: () => void;
    getQueue: () => { uploadId: string; item: UploadItem }[];
    getQueueItem: (uploadId: string) => UploadItem | undefined;
};

export const useUploadQueueStore = create<UploadQueueStore>()(
    devtools(
        (set, get) => ({
            queue: new Map(),

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
        }),
        { name: 'UploadQueueStore' }
    )
);
