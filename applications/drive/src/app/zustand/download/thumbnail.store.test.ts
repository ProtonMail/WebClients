import { act, renderHook } from '@testing-library/react';
import * as idbKeyval from 'idb-keyval';

import { sendErrorReport } from '../../utils/errorHandling';
import { useThumbnailCacheStore } from './thumbnail.store';

jest.mock('idb-keyval', () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    createStore: jest.fn(() => 'mock-store'),
}));

jest.mock('../../utils/errorHandling', () => ({
    sendErrorReport: jest.fn(),
}));

// Mock console.error to avoid polluting test output
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});
afterAll(() => {
    console.error = originalConsoleError;
});

const idbGetMocked = jest.mocked(idbKeyval.get);

describe('useThumbnailCacheStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getThumbnail', () => {
        it('should return a thumbnail if it exists in the store', async () => {
            const mockThumbnail = new Uint8Array([1, 2, 3, 4]);

            idbGetMocked.mockResolvedValueOnce(mockThumbnail);

            const { result } = renderHook(() => useThumbnailCacheStore());

            let thumbnail;
            await act(async () => {
                thumbnail = await result.current.getThumbnail('test-id');
            });

            expect(idbKeyval.get).toHaveBeenCalledWith('test-id', 'mock-store');
            expect(thumbnail).toBe(mockThumbnail);
        });

        it('should return undefined when a thumbnail is not found', async () => {
            idbGetMocked.mockResolvedValueOnce(undefined);

            const { result } = renderHook(() => useThumbnailCacheStore());

            let thumbnail;
            await act(async () => {
                thumbnail = await result.current.getThumbnail('missing-id');
            });

            expect(idbKeyval.get).toHaveBeenCalledWith('missing-id', 'mock-store');
            expect(thumbnail).toBeUndefined();
        });

        it('should return undefined when there is an error', async () => {
            idbGetMocked.mockRejectedValueOnce(new Error('Test error'));

            const { result } = renderHook(() => useThumbnailCacheStore());

            let thumbnail;
            await act(async () => {
                thumbnail = await result.current.getThumbnail('error-id');
            });

            expect(sendErrorReport).toHaveBeenCalled();
            expect(thumbnail).toBeUndefined();
        });
    });

    describe('addThumbnail', () => {
        it('should add a new thumbnail to the store', async () => {
            idbGetMocked.mockResolvedValueOnce({ queue: [], totalSize: 0 });
            idbGetMocked.mockResolvedValueOnce({ queue: ['test-id'], totalSize: 4 });

            const { result } = renderHook(() => useThumbnailCacheStore());
            const testData = new Uint8Array([1, 2, 3, 4]);

            await act(async () => {
                await result.current.addThumbnail('test-id', testData);
            });

            expect(idbKeyval.get).toHaveBeenCalledWith('thumbnail-encrypted-cache-metadata', 'mock-store');
            expect(idbKeyval.set).toHaveBeenCalledWith('test-id', testData, 'mock-store');
            expect(idbKeyval.set).toHaveBeenCalledWith(
                'thumbnail-encrypted-cache-metadata',
                { queue: ['test-id'], totalSize: 4 },
                'mock-store'
            );
            expect(result.current.thumbnailIds).toEqual(['test-id']);
        });
    });

    describe('storage limits', () => {
        it('should enforce MAX_ENTRIES limit by removing oldest thumbnails', async () => {
            const overSizedQueue = Array.from({ length: 501 }, (_, i) => `id-${i}`);

            idbGetMocked.mockResolvedValueOnce({
                queue: overSizedQueue,
                totalSize: 501 * 10,
            });

            idbGetMocked.mockResolvedValueOnce(new Uint8Array(10));

            const updatedQueue = [...overSizedQueue.slice(1), 'new-id'];
            idbGetMocked.mockResolvedValueOnce({
                queue: updatedQueue,
                totalSize: 501 * 10,
            });

            const { result } = renderHook(() => useThumbnailCacheStore());

            act(() => {
                result.current.thumbnailIds = updatedQueue;
            });

            const newData = new Uint8Array(10);

            await act(async () => {
                await result.current.addThumbnail('new-id', newData);
            });

            expect(idbKeyval.del).toHaveBeenCalledWith('id-0', 'mock-store');
        });

        it('should enforce MAX_SIZE_BYTES limit by removing oldest thumbnails', async () => {
            const MAX_SIZE_BYTES = 20 * 1024 * 1024;
            const EXCEED_AMOUNT = 1024 * 100;

            idbGetMocked.mockResolvedValueOnce({
                queue: ['id-1', 'id-2', 'id-3'],
                totalSize: MAX_SIZE_BYTES + EXCEED_AMOUNT,
            });

            const evictedSize = 1024 * 200;
            idbGetMocked.mockResolvedValueOnce(new Uint8Array(evictedSize));
            idbGetMocked.mockResolvedValueOnce({
                queue: ['id-2', 'id-3', 'new-id'],
                totalSize: MAX_SIZE_BYTES + EXCEED_AMOUNT - evictedSize + 50, // Added 50 bytes with new thumbnail
            });

            const { result } = renderHook(() => useThumbnailCacheStore());
            const newData = new Uint8Array(50);

            await act(async () => {
                await result.current.addThumbnail('new-id', newData);
            });

            expect(idbKeyval.del).toHaveBeenCalledWith('id-1', 'mock-store');

            expect(result.current.thumbnailIds).toEqual(['id-2', 'id-3', 'new-id']);
        });

        it('should handle multiple evictions to get below size limit', async () => {
            const MAX_SIZE_BYTES = 20 * 1024 * 1024;
            const LARGE_EXCEED = 1024 * 1024 * 2;

            idbGetMocked.mockResolvedValueOnce({
                queue: ['id-1', 'id-2', 'id-3', 'id-4'],
                totalSize: MAX_SIZE_BYTES + LARGE_EXCEED,
            });

            idbGetMocked.mockResolvedValueOnce(new Uint8Array(1024 * 1024));

            idbGetMocked.mockResolvedValueOnce(new Uint8Array(1024 * 1024 * 1.5));

            idbGetMocked.mockResolvedValueOnce({
                queue: ['id-3', 'id-4', 'new-id'],
                totalSize: MAX_SIZE_BYTES + LARGE_EXCEED - 1024 * 1024 - 1024 * 1024 * 1.5 + 100,
            });

            const { result } = renderHook(() => useThumbnailCacheStore());
            const newData = new Uint8Array(100);

            await act(async () => {
                await result.current.addThumbnail('new-id', newData);
            });

            expect(idbKeyval.del).toHaveBeenCalledWith('id-1', 'mock-store');
            expect(idbKeyval.del).toHaveBeenCalledWith('id-2', 'mock-store');

            expect(result.current.thumbnailIds).toEqual(['id-3', 'id-4', 'new-id']);
        });

        it('should update existing thumbnail without triggering eviction', async () => {
            idbGetMocked.mockResolvedValueOnce({
                queue: ['id-1', 'id-2', 'existing-id'],
                totalSize: 1000,
            });

            idbGetMocked.mockResolvedValueOnce(new Uint8Array(100));

            idbGetMocked.mockResolvedValueOnce({
                queue: ['id-1', 'id-2', 'existing-id'],
                totalSize: 1000 - 100 + 200, // Replace 100 bytes with 200 bytes
            });

            const { result } = renderHook(() => useThumbnailCacheStore());
            const updatedData = new Uint8Array(200);

            await act(async () => {
                await result.current.addThumbnail('existing-id', updatedData);
            });

            expect(idbKeyval.set).toHaveBeenCalledWith(
                'thumbnail-encrypted-cache-metadata',
                expect.objectContaining({
                    queue: ['id-1', 'id-2', 'existing-id'],
                }),
                'mock-store'
            );
            expect(idbKeyval.del).not.toHaveBeenCalled();
        });

        it('should handle errors during thumbnail eviction and continue processing', async () => {
            idbGetMocked.mockResolvedValueOnce({
                queue: ['error-id', 'id-2', 'id-3'],
                totalSize: 1000,
            });

            idbGetMocked.mockRejectedValueOnce(new Error('Failed to get thumbnail'));

            const updatedQueue = ['id-2', 'id-3', 'new-id'];
            idbGetMocked.mockResolvedValueOnce({
                queue: updatedQueue,
                totalSize: 1000 + 50,
            });

            const { result } = renderHook(() => useThumbnailCacheStore());

            act(() => {
                result.current.thumbnailIds = updatedQueue;
            });

            const newData = new Uint8Array(50);

            await act(async () => {
                await result.current.addThumbnail('new-id', newData);
            });

            expect(sendErrorReport).toHaveBeenCalled();
            expect(idbKeyval.set).toHaveBeenCalledWith(
                'thumbnail-encrypted-cache-metadata',
                expect.any(Object),
                'mock-store'
            );
        });
    });
});
