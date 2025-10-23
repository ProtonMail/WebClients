import { act, renderHook } from '@testing-library/react';
import { performance } from 'perf_hooks';

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
    });

    it('should return upload-only queue details', () => {
        addUploadItems({
            uploadId: 'upload-1',
            item: createUploadItem({
                name: 'Upload only',
                uploadedBytes: 75,
                status: UploadStatus.InProgress,
            }),
        });

        const { result } = renderHook(() => useTransferManagerState());

        expect(result.current.items).toHaveLength(1);
        expect(result.current.downloads).toHaveLength(0);
        expect(result.current.uploads).toHaveLength(1);
        expect(result.current.transferType).toBe('uploading');
        expect(result.current.status).toBe(TransferManagerStatus.InProgress);
        expect(result.current.progressPercentage).toBe(75);
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
