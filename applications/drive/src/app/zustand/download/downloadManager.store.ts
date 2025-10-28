import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import generateUID from '@proton/utils/generateUID';

// TODO: Maybe find a new home for this const since it's shared between download/upload
export enum BaseTransferStatus {
    InProgress = 'inProgress',
    Failed = 'failed',
    Paused = 'paused',
    PausedServer = 'pausedServer',
    Finished = 'finished',
    Pending = 'pending',
    Cancelled = 'cancelled',
}

export enum DownloadStatus {
    InProgress = BaseTransferStatus.InProgress,
    Failed = BaseTransferStatus.Failed,
    Paused = BaseTransferStatus.Paused,
    PausedServer = BaseTransferStatus.PausedServer,
    // During Finalizing the SDK has finished, we're saving the file
    Finalizing = 'finalizing',
    // The savePromise has finished and the file is downloaded
    Finished = BaseTransferStatus.Finished,
    // Download waiting to start in queue
    Pending = BaseTransferStatus.Pending,
    Cancelled = BaseTransferStatus.Cancelled,
}

type DownloadStatusKeys = (typeof DownloadStatus)[keyof typeof DownloadStatus];

export enum MalawareDownloadResolution {
    CancelDownload = 'CancelDownload',
    ContinueDownload = 'ContinueDownload',
}

type MalawareStatus = 'clean' | 'infected';

export type DownloadItem = {
    downloadId: string;
    name: string;
    storageSize: number | undefined;
    thumbnailUrl?: string;
    error?: Error | unknown;
    speedBytesPerSecond?: number;
    status: DownloadStatusKeys;
    nodeUids: string[];
    downloadedBytes: number;
    malawareDetected?: Record<string, MalawareStatus>;
};

export type DownloadItemInput = Omit<DownloadItem, 'downloadId' | 'malwareState'>;

type DownloadManagerStore = {
    queue: Map<string, DownloadItem>;
    queueIds: Set<string>;
    addDownloadItem: (item: DownloadItemInput) => string;
    updateDownloadItem: (downloadId: string, update: Partial<DownloadItem>) => void;
    removeDownloadItems: (downloadIds: string[]) => void;
    clearQueue: () => void;
    getQueue: () => DownloadItem[];
    getQueueItem: (downloadId: string) => DownloadItem | undefined;
};

const initialState = {
    queue: new Map(),
    queueIds: new Set<string>(),
};

export const useDownloadManagerStore = create<DownloadManagerStore>()(
    devtools(
        (set, get) => ({
            ...initialState,
            addDownloadItem: (item) => {
                const downloadId = generateUID();
                const downloadItem: DownloadItem = {
                    ...item,
                    malawareDetected: undefined,
                    downloadId,
                };

                set((state) => {
                    const queue = new Map(state.queue);
                    queue.set(downloadId, downloadItem);
                    const queueIds = new Set(state.queueIds);
                    queueIds.add(downloadId);

                    return { queue, queueIds };
                });

                return downloadId;
            },
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

                    return {
                        queue,
                        queueIds: new Set(queue.keys()),
                    };
                }),
            clearQueue: () => set(initialState),
            getQueue: () => Array.from(get().queue.values()),
            getQueueItem: (downloadId) => get().queue.get(downloadId),
        }),
        { name: 'DownloadManagerStore' }
    )
);
