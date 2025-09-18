import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export enum UploadStatus {
    Uploading = 'uploading',
    Failed = 'failed',
    Paused = 'paused',
    PausedServer = 'pausedServer',
    Finished = 'finished',
    Pending = 'pending',
    Cancelled = 'cancelled',
    ConflictFound = 'conflictFound',
}

export type UploadItem = {
    uploadId: string;
    name: string;
    progress: number;
    thumbnailUrl?: string;
    error?: Error;
    speedBytesPerSecond?: number;
    status: UploadStatus;
};

type UploadManagerStore = {
    queue: Map<string, UploadItem>;
    addUploadItem: (item: UploadItem) => void;
    updateUploadItem: (uploadId: string, update: Partial<UploadItem>) => void;
    removeUploadItems: (uploadIds: string[]) => void;
    clearQueue: () => void;
    getQueue: () => UploadItem[];
    getQueueItem: (uploadId: string) => UploadItem | undefined;
};

const initialState: Pick<UploadManagerStore, 'queue'> = {
    queue: new Map(),
};

export const useUploadManagerStore = create<UploadManagerStore>()(
    devtools(
        (set, get) => ({
            ...initialState,
            addUploadItem: (item: UploadItem) =>
                set((state) => ({
                    queue: new Map(state.queue).set(item.uploadId, item),
                })),
            updateUploadItem: (uploadId, update) =>
                set((state) => {
                    const existing = state.queue.get(uploadId);
                    if (!existing) {
                        return {};
                    }
                    const queue = new Map(state.queue);
                    queue.set(uploadId, { ...existing, ...update });
                    return { queue };
                }),
            removeUploadItems: (uploadIds) =>
                set((state) => {
                    if (uploadIds.length === 0) {
                        return {};
                    }
                    const queue = new Map(state.queue);
                    uploadIds.forEach((id) => queue.delete(id));
                    return { queue };
                }),
            clearQueue: () => set({ queue: new Map() }),
            getQueue: () => Array.from(get().queue.values()),
            getQueueItem: (uploadId) => get().queue.get(uploadId),
        }),
        { name: 'UploadManagerStore' }
    )
);
