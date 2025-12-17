import { act, renderHook } from '@testing-library/react';
import { performance } from 'perf_hooks';

import { NodeType } from '@proton/drive';
import { type UploadItem, UploadStatus, useUploadQueueStore } from '@proton/drive/modules/upload';

import {
    type DownloadItem,
    DownloadStatus,
    useDownloadManagerStore,
} from '../../zustand/download/downloadManager.store';
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

const FUTURE_STATUS_UPDATE_OFFSET = 10_000;
const createFutureStatusDate = (offset = 0) => new Date(Date.now() + FUTURE_STATUS_UPDATE_OFFSET + offset);

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
    malwareDetected: undefined,
    lastStatusUpdateTime: overrides.lastStatusUpdateTime ?? createFutureStatusDate(),
    ...overrides,
});

const createUploadItem = (overrides: Partial<UploadItem> = {}): UploadItem =>
    ({
        uploadId: 'upload-1',
        name: 'Upload item',
        uploadedBytes: 0,
        clearTextExpectedSize: 100,
        status: UploadStatus.Pending,
        speedBytesPerSecond: undefined,
        batchId: 'batch-1',
        lastStatusUpdateTime: overrides.lastStatusUpdateTime ?? createFutureStatusDate(),
        type: NodeType.File,
        ...overrides,
    }) as UploadItem;

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

const addUploadItems = (...items: UploadItem[]) => {
    seedUploadStore((state) => {
        const queue = new Map(state.queue);
        items.forEach((item) => {
            queue.set(item.uploadId, item);
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

        addUploadItems(
            createUploadItem({
                uploadId: 'upload-1',
                name: 'Draft.docx',
                uploadedBytes: 25,
                status: UploadStatus.Pending,
            })
        );

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
        addUploadItems(
            createUploadItem({
                uploadId: 'upload-1',
                name: 'Upload only',
                uploadedBytes: 75,
                status: UploadStatus.InProgress,
                type: NodeType.File,
            })
        );

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

    it('should ignore transfers whose last status update happened before the reset window', () => {
        const staleDate = new Date('2000-01-01T00:00:00Z');
        addDownloadItems(
            createDownloadItem({
                downloadId: 'stale-download',
                name: 'Stale download',
                status: DownloadStatus.InProgress,
                downloadedBytes: 50,
                lastStatusUpdateTime: staleDate,
            }),
            createDownloadItem({
                downloadId: 'fresh-download',
                name: 'Fresh download',
                status: DownloadStatus.InProgress,
                downloadedBytes: 80,
            })
        );

        const { result } = renderHook(() => useTransferManagerState());

        expect(result.current.items).toHaveLength(2);
        expect(result.current.progressPercentage).toBe(80);
    });

    it('should return 0 transferredBytes for pending folders', () => {
        addUploadItems(
            createUploadItem({
                uploadId: 'upload-folder-1',
                name: 'My Folder',
                status: UploadStatus.Pending,
                type: NodeType.Folder,
            })
        );

        const { result } = renderHook(() => useTransferManagerState());

        expect(result.current.uploads).toHaveLength(1);
        expect(result.current.uploads[0].transferredBytes).toBe(0);
        expect(result.current.uploads[0].clearTextSize).toBe(0);
    });

    it('should return 100 transferredBytes for finished folders', () => {
        addUploadItems(
            createUploadItem({
                uploadId: 'upload-folder-2',
                name: 'My Folder',
                status: UploadStatus.Finished,
                type: NodeType.Folder,
            })
        );

        const { result } = renderHook(() => useTransferManagerState());

        expect(result.current.uploads).toHaveLength(1);
        expect(result.current.uploads[0].transferredBytes).toBe(100);
        expect(result.current.uploads[0].clearTextSize).toBe(0);
    });

    it('should prioritize in-progress transfers over failed and pending, then order by last status update', () => {
        const baseTime = Date.now() + FUTURE_STATUS_UPDATE_OFFSET;
        const oldest = new Date(baseTime + 1_000);
        const older = new Date(baseTime + 2_000);
        const recent = new Date(baseTime + 3_000);
        const mostRecent = new Date(baseTime + 4_000);

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
            createUploadItem({
                uploadId: 'upload-in-progress',
                name: 'Active upload',
                uploadedBytes: 40,
                status: UploadStatus.InProgress,
                type: NodeType.File,
                lastStatusUpdateTime: older,
            }),
            createUploadItem({
                uploadId: 'upload-finished',
                name: 'Finished upload',
                uploadedBytes: 80,
                status: UploadStatus.Finished,
                type: NodeType.File,
                lastStatusUpdateTime: oldest,
            }),
            createUploadItem({
                uploadId: 'upload-failed',
                name: 'Failed upload',
                uploadedBytes: 50,
                status: UploadStatus.Failed,
                type: NodeType.File,
                lastStatusUpdateTime: recent,
            }),
            createUploadItem({
                uploadId: 'upload-pending',
                name: 'Pending upload',
                uploadedBytes: 10,
                status: UploadStatus.Pending,
                type: NodeType.File,
                lastStatusUpdateTime: recent,
            })
        );

        const { result } = renderHook(() => useTransferManagerState());
        const idsInOrder = result.current.items.map(({ id }) => id);

        expect(idsInOrder).toEqual([
            'download-in-progress',
            'upload-in-progress',
            'upload-failed',
            'upload-pending',
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
                malwareDetected: undefined,
                lastStatusUpdateTime: createFutureStatusDate(),
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
