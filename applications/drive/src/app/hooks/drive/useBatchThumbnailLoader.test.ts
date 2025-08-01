/*
 * Tests for the batch thumbnail loader. The hook uses setInterval to process
 * thumbnail requests in batches every 100ms. This prevents overwhelming the API
 * during rapid scrolling while keeping thumbnails loading steadily.
 */
import { renderHook, waitFor } from '@testing-library/react';

import { ThumbnailType, useDrive } from '@proton/drive/index';

import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { useThumbnailStore } from '../../zustand/thumbnail/thumbnail.store';
import { useBatchThumbnailLoader } from './useBatchThumbnailLoader';

jest.mock('@proton/drive/index');
jest.mock('../../utils/errorHandling/useSdkErrorHandler');
jest.mock('../../zustand/thumbnail/thumbnail.store');

const mockUseDrive = jest.mocked(useDrive);
const mockUseSdkErrorHandler = jest.mocked(useSdkErrorHandler);
const mockUseThumbnailStore = jest.mocked(useThumbnailStore);

const mockDriveClient = {
    iterateThumbnails: jest.fn(),
};

const mockSetThumbnail = jest.fn();
const mockHandleError = jest.fn();

const mockThumbnailItem = {
    uid: 'test-uid-1',
    thumbnailId: 'test-thumbnail-1',
    hasThumbnail: true,
    cachedThumbnailUrl: undefined,
};

const mockThumbnailResult = {
    nodeUid: 'test-uid-1',
    ok: true,
    thumbnail: new Uint8Array([1, 2, 3, 4]),
};

const mockFailedThumbnailResult = {
    nodeUid: 'test-uid-2',
    ok: false,
};

describe('useBatchThumbnailLoader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        mockUseDrive.mockReturnValue({ drive: mockDriveClient } as any);
        mockUseSdkErrorHandler.mockReturnValue({ handleError: mockHandleError });
        mockUseThumbnailStore.mockReturnValue({
            thumbnails: {},
            setThumbnail: mockSetThumbnail,
        });

        global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
        global.Blob = jest.fn() as any;
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('loadThumbnail', () => {
        it('should not load thumbnail if item does not have thumbnail', () => {
            const { result } = renderHook(() => useBatchThumbnailLoader());

            const itemWithoutThumbnail = {
                ...mockThumbnailItem,
                hasThumbnail: false,
            };

            result.current.loadThumbnail(itemWithoutThumbnail);

            jest.advanceTimersByTime(100);

            expect(mockDriveClient.iterateThumbnails).not.toHaveBeenCalled();
        });

        it('should not load thumbnail if already cached', () => {
            const { result } = renderHook(() => useBatchThumbnailLoader());

            const cachedItem = {
                ...mockThumbnailItem,
                cachedThumbnailUrl: 'cached-url',
            };

            result.current.loadThumbnail(cachedItem);
            jest.advanceTimersByTime(100);

            expect(mockDriveClient.iterateThumbnails).not.toHaveBeenCalled();
        });

        it('should not load thumbnail if already in store', () => {
            mockUseThumbnailStore.mockReturnValue({
                thumbnails: { 'test-thumbnail-1': { sdUrl: 'stored-url' } },
                setThumbnail: mockSetThumbnail,
            });

            const { result } = renderHook(() => useBatchThumbnailLoader());

            result.current.loadThumbnail(mockThumbnailItem);
            jest.advanceTimersByTime(100);

            expect(mockDriveClient.iterateThumbnails).not.toHaveBeenCalled();
        });

        it('should batch multiple thumbnail requests', async () => {
            mockDriveClient.iterateThumbnails.mockImplementation(async function* (uids) {
                for (const uid of uids) {
                    yield { ...mockThumbnailResult, nodeUid: uid };
                }
            });

            const { result } = renderHook(() => useBatchThumbnailLoader());

            const item1 = { ...mockThumbnailItem, uid: 'uid-1', thumbnailId: 'thumb-1' };
            const item2 = { ...mockThumbnailItem, uid: 'uid-2', thumbnailId: 'thumb-2' };
            const item3 = { ...mockThumbnailItem, uid: 'uid-3', thumbnailId: 'thumb-3' };

            result.current.loadThumbnail(item1);
            result.current.loadThumbnail(item2);
            result.current.loadThumbnail(item3);

            jest.advanceTimersByTime(100);
            await waitFor(() =>
                expect(mockDriveClient.iterateThumbnails).toHaveBeenCalledWith(
                    ['uid-1', 'uid-2', 'uid-3'],
                    ThumbnailType.Type1
                )
            );

            expect(mockDriveClient.iterateThumbnails).toHaveBeenCalledTimes(1);
        });

        it('should process requests on interval', async () => {
            mockDriveClient.iterateThumbnails.mockImplementation(async function* () {
                yield mockThumbnailResult;
            });

            const { result } = renderHook(() => useBatchThumbnailLoader({ intervalMs: 150 }));

            result.current.loadThumbnail(mockThumbnailItem);

            // Should not load immediately
            expect(mockDriveClient.iterateThumbnails).not.toHaveBeenCalled();

            // Add another item before interval triggers
            result.current.loadThumbnail({
                ...mockThumbnailItem,
                uid: 'uid-2',
                thumbnailId: 'thumb-2',
            });

            // Advance time to trigger interval
            jest.advanceTimersByTime(150);

            await waitFor(() => expect(mockDriveClient.iterateThumbnails).toHaveBeenCalledTimes(1));

            // Check that the function was called with the correct UIDs
            const [firstArg] = mockDriveClient.iterateThumbnails.mock.calls[0];
            expect(firstArg).toEqual(expect.arrayContaining(['test-uid-1', 'uid-2']));
        });
    });

    describe('batchLoadThumbnails', () => {
        it('should handle successful thumbnail loading', async () => {
            mockDriveClient.iterateThumbnails.mockImplementation(async function* () {
                yield mockThumbnailResult;
            });

            const { result } = renderHook(() => useBatchThumbnailLoader());

            result.current.loadThumbnail(mockThumbnailItem);

            jest.advanceTimersByTime(100);
            await waitFor(() =>
                expect(mockSetThumbnail).toHaveBeenCalledWith('test-thumbnail-1', {
                    sdUrl: 'blob:test-url',
                })
            );

            expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
        });

        it('should handle failed thumbnail loading', async () => {
            mockDriveClient.iterateThumbnails.mockImplementation(async function* () {
                yield mockFailedThumbnailResult;
            });

            const { result } = renderHook(() => useBatchThumbnailLoader());

            const failedItem = {
                ...mockThumbnailItem,
                uid: 'test-uid-2',
                thumbnailId: 'test-thumbnail-2',
            };

            result.current.loadThumbnail(failedItem);

            jest.advanceTimersByTime(100);
            await waitFor(() => expect(mockSetThumbnail).toHaveBeenCalledWith('test-thumbnail-2', {}));
        });

        it('should handle API errors gracefully', async () => {
            const testError = new Error('API Error');
            mockDriveClient.iterateThumbnails.mockImplementation(async function* () {
                throw testError;
            });

            const { result } = renderHook(() => useBatchThumbnailLoader());

            result.current.loadThumbnail(mockThumbnailItem);

            jest.advanceTimersByTime(100);
            await waitFor(() =>
                expect(mockHandleError).toHaveBeenCalledWith(testError, {
                    showNotification: false,
                })
            );

            expect(mockSetThumbnail).toHaveBeenCalledWith('test-thumbnail-1', {});
        });

        it('should use custom thumbnail type', async () => {
            mockDriveClient.iterateThumbnails.mockImplementation(async function* () {
                yield mockThumbnailResult;
            });

            const { result } = renderHook(() => useBatchThumbnailLoader({ thumbnailType: ThumbnailType.Type2 }));

            result.current.loadThumbnail(mockThumbnailItem);

            jest.advanceTimersByTime(100);
            await waitFor(() =>
                expect(mockDriveClient.iterateThumbnails).toHaveBeenCalledWith(['test-uid-1'], ThumbnailType.Type2)
            );
        });

        it('should not process results for unknown items', async () => {
            mockDriveClient.iterateThumbnails.mockImplementation(async function* () {
                yield { ...mockThumbnailResult, nodeUid: 'unknown-uid' };
            });

            const { result } = renderHook(() => useBatchThumbnailLoader());

            result.current.loadThumbnail(mockThumbnailItem);

            jest.advanceTimersByTime(100);
            await waitFor(() => expect(mockDriveClient.iterateThumbnails).toHaveBeenCalled());

            expect(mockSetThumbnail).not.toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        it('should clear interval on unmount', () => {
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

            const { result, unmount } = renderHook(() => useBatchThumbnailLoader());

            result.current.loadThumbnail(mockThumbnailItem);

            unmount();

            expect(clearIntervalSpy).toHaveBeenCalled();
        });

        it('should clear items map on unmount', () => {
            const { result, unmount } = renderHook(() => useBatchThumbnailLoader());

            result.current.loadThumbnail(mockThumbnailItem);

            unmount();

            expect(() => unmount()).not.toThrow();
        });
    });

    describe('edge cases', () => {
        it('should handle duplicate UIDs', async () => {
            mockDriveClient.iterateThumbnails.mockImplementation(async function* () {
                yield mockThumbnailResult;
            });

            const { result } = renderHook(() => useBatchThumbnailLoader());

            result.current.loadThumbnail(mockThumbnailItem);
            result.current.loadThumbnail(mockThumbnailItem);

            jest.advanceTimersByTime(100);
            await waitFor(() =>
                expect(mockDriveClient.iterateThumbnails).toHaveBeenCalledWith(['test-uid-1'], ThumbnailType.Type1)
            );
        });

        it('should not process while already processing', async () => {
            // Make the first call hang to simulate processing
            let resolveFirstCall: () => void;
            const firstCallPromise = new Promise<void>((resolve) => {
                resolveFirstCall = resolve;
            });

            mockDriveClient.iterateThumbnails
                .mockImplementationOnce(async function* () {
                    await firstCallPromise;
                    yield mockThumbnailResult;
                })
                .mockImplementation(async function* () {
                    yield mockThumbnailResult;
                });

            const { result } = renderHook(() => useBatchThumbnailLoader());

            result.current.loadThumbnail(mockThumbnailItem);

            // Trigger first interval
            jest.advanceTimersByTime(100);

            // Add another item while first is still processing
            result.current.loadThumbnail({
                ...mockThumbnailItem,
                uid: 'uid-2',
                thumbnailId: 'thumb-2',
            });

            // Trigger second interval (should not process due to isProcessing flag)
            jest.advanceTimersByTime(100);

            // Should only be called once so far
            expect(mockDriveClient.iterateThumbnails).toHaveBeenCalledTimes(1);

            // Resolve first call
            resolveFirstCall!();

            await waitFor(() => expect(mockDriveClient.iterateThumbnails).toHaveBeenCalledTimes(1));
        });
    });
});
