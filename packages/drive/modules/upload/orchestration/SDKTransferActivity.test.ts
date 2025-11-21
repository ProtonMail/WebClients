import { SDKEvent, getDrive } from '../../../index';
import { useUploadQueueStore } from '../store/uploadQueue.store';
import { UploadStatus } from '../types';
import { SDKTransferActivity } from './SDKTransferActivity';

jest.mock('../../../index');
jest.mock('../store/uploadQueue.store');

describe('SDKTransferActivity', () => {
    let manager: SDKTransferActivity;
    let mockOnMessage: jest.Mock;
    let mockUnsubscribePaused: jest.Mock;
    let mockUnsubscribeResumed: jest.Mock;
    let mockGetQueue: jest.Mock;
    let mockUpdateQueueItems: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockOnMessage = jest.fn();
        mockUnsubscribePaused = jest.fn();
        mockUnsubscribeResumed = jest.fn();
        mockGetQueue = jest.fn().mockReturnValue([]);
        mockUpdateQueueItems = jest.fn();

        mockOnMessage.mockReturnValueOnce(mockUnsubscribePaused).mockReturnValueOnce(mockUnsubscribeResumed);

        jest.mocked(getDrive).mockReturnValue({
            onMessage: mockOnMessage,
        } as any);

        jest.mocked(useUploadQueueStore.getState).mockReturnValue({
            getQueue: mockGetQueue,
            updateQueueItems: mockUpdateQueueItems,
        } as any);

        manager = new SDKTransferActivity();
    });

    describe('subscribe', () => {
        it('should subscribe to TransfersPaused and TransfersResumed events', () => {
            manager.subscribe();

            expect(mockOnMessage).toHaveBeenCalledTimes(2);
            expect(mockOnMessage).toHaveBeenCalledWith(SDKEvent.TransfersPaused, expect.any(Function));
            expect(mockOnMessage).toHaveBeenCalledWith(SDKEvent.TransfersResumed, expect.any(Function));
        });

        it('should not subscribe twice', () => {
            manager.subscribe();
            manager.subscribe();

            expect(mockOnMessage).toHaveBeenCalledTimes(2);
        });

        it('should mark as subscribed after subscribing', () => {
            expect(manager.isSubscribed()).toBe(false);

            manager.subscribe();

            expect(manager.isSubscribed()).toBe(true);
        });
    });

    describe('unsubscribe', () => {
        it('should unsubscribe from events', () => {
            manager.subscribe();
            manager.unsubscribe();

            expect(mockUnsubscribePaused).toHaveBeenCalled();
            expect(mockUnsubscribeResumed).toHaveBeenCalled();
        });

        it('should mark as not subscribed after unsubscribing', () => {
            manager.subscribe();
            expect(manager.isSubscribed()).toBe(true);

            manager.unsubscribe();

            expect(manager.isSubscribed()).toBe(false);
        });

        it('should handle unsubscribe when not subscribed', () => {
            manager.unsubscribe();

            expect(mockUnsubscribePaused).not.toHaveBeenCalled();
            expect(mockUnsubscribeResumed).not.toHaveBeenCalled();
        });
    });

    describe('isSubscribed', () => {
        it('should return false initially', () => {
            expect(manager.isSubscribed()).toBe(false);
        });

        it('should return true after subscribing', () => {
            manager.subscribe();

            expect(manager.isSubscribed()).toBe(true);
        });

        it('should return false after unsubscribing', () => {
            manager.subscribe();
            manager.unsubscribe();

            expect(manager.isSubscribed()).toBe(false);
        });
    });

    describe('isPaused', () => {
        it('should return false initially', () => {
            expect(manager.isPaused()).toBe(false);
        });

        it('should return true after TransfersPaused event', () => {
            manager.subscribe();

            const pausedHandler = mockOnMessage.mock.calls[0][1];
            pausedHandler();

            expect(manager.isPaused()).toBe(true);
        });

        it('should return false after TransfersResumed event', () => {
            manager.subscribe();

            const pausedHandler = mockOnMessage.mock.calls[0][1];
            const resumedHandler = mockOnMessage.mock.calls[1][1];

            pausedHandler();
            expect(manager.isPaused()).toBe(true);

            resumedHandler();
            expect(manager.isPaused()).toBe(false);
        });
    });

    describe('checkAndUnsubscribeIfQueueEmpty', () => {
        it('should unsubscribe when queue is empty', () => {
            mockGetQueue.mockReturnValue([]);
            manager.subscribe();

            manager.checkAndUnsubscribeIfQueueEmpty();

            expect(mockUnsubscribePaused).toHaveBeenCalled();
            expect(mockUnsubscribeResumed).toHaveBeenCalled();
        });

        it('should not unsubscribe when queue has pending items', () => {
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', status: UploadStatus.Pending }]);
            manager.subscribe();

            manager.checkAndUnsubscribeIfQueueEmpty();

            expect(mockUnsubscribePaused).not.toHaveBeenCalled();
        });

        it('should not unsubscribe when queue has in-progress items', () => {
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', status: UploadStatus.InProgress }]);
            manager.subscribe();

            manager.checkAndUnsubscribeIfQueueEmpty();

            expect(mockUnsubscribePaused).not.toHaveBeenCalled();
        });

        it('should unsubscribe when queue only has finished items', () => {
            mockGetQueue.mockReturnValue([
                { uploadId: 'file1', status: UploadStatus.Finished },
                { uploadId: 'file2', status: UploadStatus.Failed },
                { uploadId: 'file3', status: UploadStatus.Cancelled },
                { uploadId: 'file4', status: UploadStatus.Skipped },
            ]);
            manager.subscribe();

            manager.checkAndUnsubscribeIfQueueEmpty();

            expect(mockUnsubscribePaused).toHaveBeenCalled();
        });

        it('should do nothing when not subscribed', () => {
            mockGetQueue.mockReturnValue([]);

            manager.checkAndUnsubscribeIfQueueEmpty();

            expect(mockUnsubscribePaused).not.toHaveBeenCalled();
        });
    });

    describe('handleTransfersPaused', () => {
        it('should pause all in-progress uploads', () => {
            mockGetQueue.mockReturnValue([
                { uploadId: 'file1', status: UploadStatus.InProgress },
                { uploadId: 'file2', status: UploadStatus.InProgress },
                { uploadId: 'file3', status: UploadStatus.Pending },
            ]);

            manager.subscribe();
            const pausedHandler = mockOnMessage.mock.calls[0][1];
            pausedHandler();

            expect(mockUpdateQueueItems).toHaveBeenCalledTimes(2);
            expect(mockUpdateQueueItems).toHaveBeenCalledWith('file1', { status: UploadStatus.PausedServer });
            expect(mockUpdateQueueItems).toHaveBeenCalledWith('file2', { status: UploadStatus.PausedServer });
        });

        it('should not affect non-in-progress uploads', () => {
            mockGetQueue.mockReturnValue([
                { uploadId: 'file1', status: UploadStatus.Pending },
                { uploadId: 'file2', status: UploadStatus.Finished },
                { uploadId: 'file3', status: UploadStatus.Failed },
            ]);

            manager.subscribe();
            const pausedHandler = mockOnMessage.mock.calls[0][1];
            pausedHandler();

            expect(mockUpdateQueueItems).not.toHaveBeenCalled();
        });

        it('should set isPaused flag', () => {
            manager.subscribe();
            const pausedHandler = mockOnMessage.mock.calls[0][1];

            expect(manager.isPaused()).toBe(false);
            pausedHandler();
            expect(manager.isPaused()).toBe(true);
        });
    });

    describe('handleTransfersResumed', () => {
        it('should resume all paused uploads', () => {
            mockGetQueue.mockReturnValue([
                { uploadId: 'file1', status: UploadStatus.PausedServer },
                { uploadId: 'file2', status: UploadStatus.PausedServer },
                { uploadId: 'file3', status: UploadStatus.Pending },
            ]);

            manager.subscribe();
            const resumedHandler = mockOnMessage.mock.calls[1][1];
            resumedHandler();

            expect(mockUpdateQueueItems).toHaveBeenCalledTimes(2);
            expect(mockUpdateQueueItems).toHaveBeenCalledWith('file1', { status: UploadStatus.InProgress });
            expect(mockUpdateQueueItems).toHaveBeenCalledWith('file2', { status: UploadStatus.InProgress });
        });

        it('should not affect non-paused uploads', () => {
            mockGetQueue.mockReturnValue([
                { uploadId: 'file1', status: UploadStatus.Pending },
                { uploadId: 'file2', status: UploadStatus.InProgress },
                { uploadId: 'file3', status: UploadStatus.Finished },
            ]);

            manager.subscribe();
            const resumedHandler = mockOnMessage.mock.calls[1][1];
            resumedHandler();

            expect(mockUpdateQueueItems).not.toHaveBeenCalled();
        });

        it('should clear isPaused flag', () => {
            manager.subscribe();
            const pausedHandler = mockOnMessage.mock.calls[0][1];
            const resumedHandler = mockOnMessage.mock.calls[1][1];

            pausedHandler();
            expect(manager.isPaused()).toBe(true);

            resumedHandler();
            expect(manager.isPaused()).toBe(false);
        });
    });

    describe('pause and resume cycle', () => {
        it('should handle multiple pause/resume cycles', () => {
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', status: UploadStatus.InProgress }]);

            manager.subscribe();
            const pausedHandler = mockOnMessage.mock.calls[0][1];
            const resumedHandler = mockOnMessage.mock.calls[1][1];

            pausedHandler();
            expect(manager.isPaused()).toBe(true);
            expect(mockUpdateQueueItems).toHaveBeenCalledWith('file1', { status: UploadStatus.PausedServer });

            mockUpdateQueueItems.mockClear();
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', status: UploadStatus.PausedServer }]);

            resumedHandler();
            expect(manager.isPaused()).toBe(false);
            expect(mockUpdateQueueItems).toHaveBeenCalledWith('file1', { status: UploadStatus.InProgress });

            mockUpdateQueueItems.mockClear();
            mockGetQueue.mockReturnValue([{ uploadId: 'file1', status: UploadStatus.InProgress }]);

            pausedHandler();
            expect(manager.isPaused()).toBe(true);
            expect(mockUpdateQueueItems).toHaveBeenCalledWith('file1', { status: UploadStatus.PausedServer });
        });
    });
});
