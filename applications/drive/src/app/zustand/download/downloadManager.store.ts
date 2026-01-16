import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { NodeType, ProtonDriveClient, ProtonDrivePhotosClient, ProtonDrivePublicLinkClient } from '@proton/drive';
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

export enum IssueStatus {
    Detected = 'detected',
    Approved = 'approved',
    Rejected = 'rejected',
}

export type SignatureIssue = {
    name: string;
    nodeType: NodeType;
    issueStatus: IssueStatus;
    message: string;
};

export type DownloadItem = {
    driveClient?: ProtonDriveClient | ProtonDrivePhotosClient | ProtonDrivePublicLinkClient;
    downloadId: string;
    name: string;
    storageSize: number | undefined;
    thumbnailUrl?: string;
    error?: Error | unknown;
    speedBytesPerSecond?: number;
    status: DownloadStatusKeys;
    nodeUids: string[];
    downloadedBytes: number;
    malwareDetected?: Map<string, IssueStatus>;
    unsupportedFileDetected?: IssueStatus;
    signatureIssues?: Record<string, SignatureIssue>;
    // Decision set with applyAll, will override individual choices
    signatureIssueAllDecision?: IssueStatus;
    lastStatusUpdateTime: Date;
    isPhoto?: boolean;
    isRetried?: boolean;
};

export type DownloadItemInput = Omit<DownloadItem, 'downloadId' | 'lastStatusUpdateTime'>;

type DownloadManagerStore = {
    queue: Map<string, DownloadItem>;
    queueIds: Set<string>;
    addDownloadItem: (item: DownloadItemInput) => string;
    updateDownloadItem: (downloadId: string, update: Partial<DownloadItem>) => void;
    addSignatureIssue: (downloadId: string, update: SignatureIssue) => void;
    updateSignatureIssueStatus: (downloadId: string, issueName: string, status: IssueStatus) => void;
    removeDownloadItems: (downloadIds: string[]) => void;
    clearQueue: () => void;
    getQueue: () => DownloadItem[];
    getQueueItem: (downloadId: string) => DownloadItem | undefined;
};

const initialState = {
    queue: new Map(),
    queueIds: new Set<string>(),
};

const isAborted = (state: Partial<DownloadItem>) =>
    state.status === DownloadStatus.Cancelled || state.status === DownloadStatus.Failed;

export const useDownloadManagerStore = create<DownloadManagerStore>()(
    devtools(
        (set, get) => ({
            ...initialState,
            addDownloadItem: (item) => {
                const downloadId = generateUID();
                const downloadItem: DownloadItem = {
                    ...item,
                    malwareDetected: undefined,
                    downloadId,
                    lastStatusUpdateTime: new Date(),
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
                    const shouldUpdateTimestamp = update.status !== existing.status;
                    const queue = new Map(state.queue);
                    if (isAborted(update)) {
                        update.signatureIssueAllDecision = undefined;
                        update.signatureIssues = undefined;
                        update.unsupportedFileDetected = undefined;
                    }
                    queue.set(downloadId, {
                        ...existing,
                        ...update,
                        lastStatusUpdateTime: shouldUpdateTimestamp ? new Date() : existing.lastStatusUpdateTime,
                    });
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
            addSignatureIssue: (downloadId, issue) =>
                set((state) => {
                    const existing = state.queue.get(downloadId);
                    if (!existing) {
                        return {};
                    }
                    const queue = new Map(state.queue);
                    queue.set(downloadId, {
                        ...existing,
                        signatureIssues: {
                            ...(existing.signatureIssues ?? {}),
                            [issue.name]: issue,
                        },
                    });
                    return { queue };
                }),
            updateSignatureIssueStatus: (downloadId, issueName, status) =>
                set((state) => {
                    const existing = state.queue.get(downloadId);
                    const issues = existing?.signatureIssues;
                    if (!existing || !issues) {
                        return {};
                    }
                    const queue = new Map(state.queue);
                    const issue = issues[issueName];
                    issue.issueStatus = status;
                    queue.set(downloadId, {
                        ...existing,
                        signatureIssues: {
                            ...(existing.signatureIssues ?? {}),
                            [issueName]: issue,
                        },
                    });
                    return { queue };
                }),
        }),
        { name: 'DownloadManagerStore' }
    )
);
