import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export enum DownloadStatus {
    Downloading = 'downloading',
    Failed = 'failed',
    Paused = 'paused',
    PausedServer = 'pausedServer',
    Finished = 'finished',
    Pending = 'pending',
    Cancelled = 'cancelled',
    MalawareDetected = 'malawareDetected',
}

export enum MalawareDownloadResolution {
    CancelDownload = 'CancelDownload',
    ContinueDownload = 'ContinueDownload',
}

export type DownloadItem = {
    downloadId: string;
    name: string;
    encryptedSize: number;
    progress: number;
    thumbnailUrl?: string;
    error?: Error;
    speedBytesPerSecond?: number;
    status: DownloadStatus;
    nodeUids: string[];
};

type DownloadManagerStore = {
    queue: Map<string, DownloadItem>;
    addDownloadItem: (item: DownloadItem) => void;
    updateDownloadItem: (downloadId: string, update: Partial<DownloadItem>) => void;
    removeDownloadItems: (downloadIds: string[]) => void;
    clearQueue: () => void;
    getQueue: () => DownloadItem[];
    getQueueItem: (downloadId: string) => DownloadItem | undefined;
};

const initialState: Pick<DownloadManagerStore, 'queue'> = {
    queue: new Map(),
};

export const useDownloadManagerStore = create<DownloadManagerStore>()(
    devtools(
        (set, get) => ({
            ...initialState,
            addDownloadItem: (item: DownloadItem) =>
                set((state) => ({
                    queue: new Map(state.queue).set(item.downloadId, item),
                })),
            updateDownloadItem: (downloadId, update) =>
                set((state) => {
                    const existing = state.queue.get(downloadId);
                    if (!existing) {
                        return {};
                    }
                    const queue = new Map(state.queue);
                    queue.set(downloadId, { ...existing, ...update });
                    return { queue };
                }),
            removeDownloadItems: (downloadIds) =>
                set((state) => {
                    if (downloadIds.length === 0) {
                        return {};
                    }
                    const queue = new Map(state.queue);
                    downloadIds.forEach((id) => queue.delete(id));
                    return { queue };
                }),
            clearQueue: () => set({ queue: new Map() }),
            getQueue: () => Array.from(get().queue.values()),
            getQueueItem: (downloadId) => get().queue.get(downloadId),
        }),
        { name: 'DownloadManagerStore' }
    )
);
