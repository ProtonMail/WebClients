import { act, renderHook } from '@testing-library/react';
import { performance } from 'perf_hooks';

import { NodeType } from '@proton/drive';

import {
    type DownloadItem,
    DownloadStatus,
    useDownloadManagerStore,
} from '../../zustand/download/downloadManager.store';
import { type UploadItem, UploadStatus, useUploadQueueStore } from '../../zustand/upload/uploadQueue.store';
import { TransferManagerStatus, useTransferManagerState } from './useTransferManagerState';

const resetStores = () => {
    act(() => {
        useDownloadManagerStore.getState().clearQueue();
        useUploadQueueStore.getState().clearQueue();
    });
};

const seedDownloadQueue = (items: Parameters<typeof useDownloadManagerStore.setState>[0]) => {
    act(() => {
        useDownloadManagerStore.setState(items);
    });
};

const seedUploadStore = (items: Parameters<typeof useUploadQueueStore.setState>[0]) => {
    act(() => {
        useUploadQueueStore.setState(items);
    });
};

const createDownloadItem = (overrides: Partial<DownloadItem> = {}): DownloadItem => ({
    downloadId: 'download-1',
    name: 'Download item',
    status: DownloadStatus.Pending,
    downloadedBytes: 0,
    storageSize: 100,
    thumbnailUrl: undefined,
    error: undefined,
    speedBytesPerSecond: 0,
    nodeUids: [],
    malawareDetected: undefined,
    lastStatusUpdateTime: overrides.lastStatusUpdateTime ?? new Date('2024-01-01T00:00:00Z'),
    ...overrides,
});

const createUploadItem = (overrides: Partial<UploadItem> = {}): UploadItem => {
    return {
        name: 'Upload item',
        uploadedBytes: 0,
        clearTextExpectedSize: 100,
        status: UploadStatus.Pending,
        speedBytesPerSecond: undefined,
        batchId: 'batch-1',
        lastStatusUpdateTime: overrides.lastStatusUpdateTime ?? new Date('2024-01-01T00:00:00Z'),
        ...overrides,
    } as UploadItem;
};

const addDownloadItems = (...items: DownloadItem[]) => {
    seedDownloadQueue((state) => {
        const queue = new Map(state.queue);
        const queueIds = new Set(state.queueIds);
        items.forEach((item) => {
            queue.set(item.downloadId, item);
            queueIds.add(item.downloadId);
        });
        return { ...state, queue, queueIds };
    });
};

const addUploadItems = (...items: { uploadId: string; item: UploadItem }[]) => {
    seedUploadStore((state) => {
        const queue = new Map(state.queue);
        items.forEach(({ uploadId, item }) => {
            queue.set(uploadId, item);
        });
        return { ...state, queue };
    });
};

describe('useTransferManagerState', () => {
    beforeEach(() => {
        resetStores();
    });

    it('returns empty state when queues are empty', () => {
        const { result } = renderHook(() => useTransferManagerState());

        expect(result.current.items).toHaveLength(0);
        expect(result.current.status).toBe(TransferManagerStatus.Empty);
        expect(result.current.transferType).toBe('empty');
        expect(result.current.progressPercentage).toBe(0);
    });

    it('should aggregate download and upload queues correctly', () => {
        addDownloadItems(
            createDownloadItem({
                name: 'Report.pdf',
                status: DownloadStatus.InProgress,
                downloadedBytes: 50,
            })
        );

        addUploadItems({
            uploadId: 'upload-1',
            item: createUploadItem({
                name: 'Draft.docx',
                uploadedBytes: 25,
                status: UploadStatus.Pending,
            }),
        });

        const { result } = renderHook(() => useTransferManagerState());

        expect(result.current.items).toHaveLength(2);
        expect(result.current.downloads).toHaveLength(1);
        expect(result.current.uploads).toHaveLength(1);
        expect(result.current.status).toBe(TransferManagerStatus.InProgress);
        expect(result.current.transferType).toBe('both');
        expect(result.current.progressPercentage).toBeGreaterThan(0);
    });

    it('should return download-only queue details', () => {
        addDownloadItems(
            createDownloadItem({
                name: 'Download only',
                status: DownloadStatus.InProgress,
                downloadedBytes: 50,
            })
        );

        const { result } = renderHook(() => useTransferManagerState());

        expect(result.current.items).toHaveLength(1);
        expect(result.current.downloads).toHaveLength(1);
        expect(result.current.uploads).toHaveLength(0);
        expect(result.current.transferType).toBe('downloading');
        expect(result.current.status).toBe(TransferManagerStatus.InProgress);
        expect(result.current.progressPercentage).toBe(50);
        expect(result.current.downloads[0].type).toBe('download');
        expect(result.current.downloads[0].storageSize).toBe(100);
    });

    it('should return upload-only queue details', () => {
        addUploadItems({
            uploadId: 'upload-1',
            item: createUploadItem({
                name: 'Upload only',
                uploadedBytes: 75,
                status: UploadStatus.InProgress,
                type: NodeType.File,
            }),
        });

        const { result } = renderHook(() => useTransferManagerState());

        expect(result.current.items).toHaveLength(1);
        expect(result.current.downloads).toHaveLength(0);
        expect(result.current.uploads).toHaveLength(1);
        expect(result.current.transferType).toBe('uploading');
        expect(result.current.status).toBe(TransferManagerStatus.InProgress);
        expect(result.current.progressPercentage).toBe(75);
        expect(result.current.uploads[0].type).toBe('upload');
        expect(result.current.uploads[0].clearTextSize).toBe(100);
    });

    it('should return 0 transferredBytes for pending folders', () => {
        addUploadItems({
            uploadId: 'upload-folder-1',
            item: createUploadItem({
                name: 'My Folder',
                status: UploadStatus.Pending,
                type: NodeType.Folder,
            }),
        });

        const { result } = renderHook(() => useTransferManagerState());

        expect(result.current.uploads).toHaveLength(1);
        expect(result.current.uploads[0].transferredBytes).toBe(0);
        expect(result.current.uploads[0].clearTextSize).toBe(0);
    });

    it('should return 100 transferredBytes for finished folders', () => {
        addUploadItems({
            uploadId: 'upload-folder-2',
            item: createUploadItem({
                name: 'My Folder',
                status: UploadStatus.Finished,
                type: NodeType.Folder,
            }),
        });

        const { result } = renderHook(() => useTransferManagerState());

        expect(result.current.uploads).toHaveLength(1);
        expect(result.current.uploads[0].transferredBytes).toBe(100);
        expect(result.current.uploads[0].clearTextSize).toBe(0);
    });

    it('should prioritize in-progress transfers and order by last status update', () => {
        const mostRecent = new Date('2024-03-01T00:00:00Z');
        const recent = new Date('2024-02-15T00:00:00Z');
        const older = new Date('2024-02-01T00:00:00Z');
        const oldest = new Date('2024-01-01T00:00:00Z');

        addDownloadItems(
            createDownloadItem({
                downloadId: 'download-finished',
                name: 'Finished download',
                status: DownloadStatus.Finished,
                downloadedBytes: 100,
                lastStatusUpdateTime: recent,
            }),
            createDownloadItem({
                downloadId: 'download-in-progress',
                name: 'Active download',
                status: DownloadStatus.InProgress,
                downloadedBytes: 25,
                lastStatusUpdateTime: mostRecent,
            })
        );

        addUploadItems(
            {
                uploadId: 'upload-in-progress',
                item: createUploadItem({
                    name: 'Active upload',
                    uploadedBytes: 40,
                    status: UploadStatus.InProgress,
                    type: NodeType.File,
                    lastStatusUpdateTime: older,
                }),
            },
            {
                uploadId: 'upload-finished',
                item: createUploadItem({
                    name: 'Finished upload',
                    uploadedBytes: 80,
                    status: UploadStatus.Finished,
                    type: NodeType.File,
                    lastStatusUpdateTime: oldest,
                }),
            }
        );

        const { result } = renderHook(() => useTransferManagerState());
        const idsInOrder = result.current.items.map(({ id }) => id);

        expect(idsInOrder).toEqual([
            'download-in-progress',
            'upload-in-progress',
            'download-finished',
            'upload-finished',
        ]);
    });

    it('should handle large queues without significant slowdown', () => {
        const downloadItems = new Map<string, DownloadItem>();
        const queueIds = new Set<string>();

        for (let i = 0; i < 10_000; i += 1) {
            const id = `download-${i}`;
            downloadItems.set(id, {
                downloadId: id,
                name: `file-${i}.bin`,
                status: DownloadStatus.Pending,
                downloadedBytes: 0,
                storageSize: 100,
                thumbnailUrl: undefined,
                error: undefined,
                speedBytesPerSecond: 0,
                nodeUids: [],
                malawareDetected: undefined,
                lastStatusUpdateTime: new Date('2024-01-01T00:00:00Z'),
            });
            queueIds.add(id);
        }

        seedDownloadQueue((state) => ({
            ...state,
            queue: downloadItems,
            queueIds,
        }));

        const start = performance.now();
        const { result } = renderHook(() => useTransferManagerState());
        const duration = performance.now() - start;

        expect(result.current.items).toHaveLength(10_000);
        expect(duration).toBeLessThan(50); // it should be around 8ms
    });
});
