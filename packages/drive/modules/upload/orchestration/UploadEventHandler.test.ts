import { NodeWithSameNameExistsValidationError } from '@protontech/drive-sdk';
import type { Mock, Mocked } from 'vitest';

import type { CapacityManager } from '../scheduling/CapacityManager';
import { useUploadControllerStore } from '../store/uploadController.store';
import { useUploadQueueStore } from '../store/uploadQueue.store';
import { UploadStatus } from '../types';
import { uploadLogError } from '../utils/uploadLogger';
import type { ConflictManager } from './ConflictManager';
import type { SDKTransferActivity } from './SDKTransferActivity';
import { UploadEventHandler } from './UploadEventHandler';

vi.mock('../store/uploadController.store');
vi.mock('../store/uploadQueue.store');
vi.mock('../utils/uploadLogger');

describe('UploadEventHandler', () => {
    let handler: UploadEventHandler;
    let mockCapacityManager: Mocked<CapacityManager>;
    let mockConflictManager: Mocked<ConflictManager>;
    let mockSDKTransferActivity: Mocked<SDKTransferActivity>;
    let mockSDKPhotosTransferActivity: Mocked<SDKTransferActivity>;
    let mockCancelFolderChildren: Mock;
    let mockUpdateQueueItems: Mock;
    let mockSetController: Mock;
    let mockSetUploadController: Mock;
    let mockRemoveControllers: Mock;
    let mockGetController: Mock;
    let mockCheckAndUnsubscribeIfQueueEmpty: Mock;
    let mockPhotosCheckAndUnsubscribeIfQueueEmpty: Mock;
    let mockGetItem: Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        mockUpdateQueueItems = vi.fn();
        mockSetController = vi.fn();
        mockSetUploadController = vi.fn();
        mockRemoveControllers = vi.fn();
        mockGetController = vi.fn();
        mockCheckAndUnsubscribeIfQueueEmpty = vi.fn();
        mockPhotosCheckAndUnsubscribeIfQueueEmpty = vi.fn();
        mockCancelFolderChildren = vi.fn();
        mockGetItem = vi.fn();

        vi.mocked(useUploadQueueStore.getState).mockReturnValue({
            updateQueueItems: mockUpdateQueueItems,
            queue: new Map(),
            getItem: mockGetItem,
        } as any);

        vi.mocked(useUploadControllerStore.getState).mockReturnValue({
            setController: mockSetController,
            setUploadController: mockSetUploadController,
            removeControllers: mockRemoveControllers,
            getController: mockGetController,
        } as any);

        mockCapacityManager = {
            updateProgress: vi.fn(),
        } as any;

        mockConflictManager = {
            handleConflict: vi.fn(),
            chooseConflictStrategy: vi.fn(),
            setBatchStrategy: vi.fn(),
        } as any;

        mockSDKTransferActivity = {
            isPaused: vi.fn().mockReturnValue(false),
            checkAndUnsubscribeIfQueueEmpty: mockCheckAndUnsubscribeIfQueueEmpty,
        } as any;

        mockSDKPhotosTransferActivity = {
            isPaused: vi.fn().mockReturnValue(false),
            checkAndUnsubscribeIfQueueEmpty: mockPhotosCheckAndUnsubscribeIfQueueEmpty,
        } as any;

        handler = new UploadEventHandler(
            mockCapacityManager,
            mockConflictManager,
            mockSDKTransferActivity,
            mockSDKPhotosTransferActivity,
            mockCancelFolderChildren
        );
    });

    afterEach(() => {
        handler?.dispose();
    });

    describe('handleEvent - file:started', () => {
        it('should set upload controller for started file', async () => {
            const mockUploadController = {} as any;
            const event = {
                type: 'file:started' as const,
                uploadId: 'task123',
                controller: mockUploadController,
                isForPhotos: false,
            };

            await handler.handleEvent(event);

            expect(mockSetUploadController).toHaveBeenCalledWith('task123', mockUploadController);
        });
    });

    describe('handleEvent - file:progress', () => {
        it('should update progress when not paused', async () => {
            const event = {
                type: 'file:progress' as const,
                uploadId: 'task123',
                uploadedBytes: 500,
                isForPhotos: false,
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                uploadedBytes: 500,
                status: UploadStatus.InProgress,
            });
            expect(mockCapacityManager.updateProgress).toHaveBeenCalledWith('task123', 500);
        });

        it('should not update progress when paused', async () => {
            mockSDKTransferActivity.isPaused.mockReturnValue(true);
            const event = {
                type: 'file:progress' as const,
                uploadId: 'task123',
                uploadedBytes: 500,
                isForPhotos: false,
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).not.toHaveBeenCalled();
            expect(mockCapacityManager.updateProgress).not.toHaveBeenCalled();
        });

        it('should not update progress when file is cancelled', async () => {
            mockGetItem.mockReturnValue({
                uploadId: 'task123',
                status: UploadStatus.Cancelled,
            });

            const event = {
                type: 'file:progress' as const,
                uploadId: 'task123',
                uploadedBytes: 500,
                isForPhotos: false,
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).not.toHaveBeenCalled();
            expect(mockCapacityManager.updateProgress).not.toHaveBeenCalled();
        });
    });

    describe('handleEvent - file:complete', () => {
        it('should mark file as finished and remove controller', async () => {
            const event = {
                type: 'file:complete' as const,
                uploadId: 'task123',
                nodeUid: 'node456',
                parentUid: 'parent123',
                isUpdatedNode: true,
                isForPhotos: false,
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.Finished,
                nodeUid: 'node456',
            });
            expect(mockRemoveControllers).toHaveBeenCalledWith(['task123']);
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
        });

        it('should mark file as EmptyFile when isEmpty is true', async () => {
            const event = {
                type: 'file:complete' as const,
                uploadId: 'task123',
                nodeUid: 'node456',
                parentUid: 'parent123',
                isUpdatedNode: false,
                isForPhotos: false,
                isEmpty: true,
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.EmptyFile,
                nodeUid: 'node456',
            });
        });

        it('should mark file as finished even when a subscriber fails', async () => {
            const error = new Error('Item not found');
            handler.subscribeToEvents('failing', vi.fn().mockRejectedValue(error));
            const event = {
                type: 'file:complete' as const,
                uploadId: 'task123',
                nodeUid: 'node456',
                parentUid: 'parent123',
                isUpdatedNode: false,
                isForPhotos: false,
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.Finished,
                nodeUid: 'node456',
            });
            expect(mockRemoveControllers).toHaveBeenCalledWith(['task123']);
            expect(uploadLogError).toHaveBeenCalledWith('Upload event subscriber failed', error, {
                uploadId: 'task123',
                eventType: 'file:complete',
            });
        });
    });

    describe('handleEvent - file:empty', () => {
        it('should mark file as EmptyFile and remove controller', async () => {
            const event = {
                type: 'file:empty' as const,
                uploadId: 'task123',
                isForPhotos: false,
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.EmptyFile,
            });
            expect(mockRemoveControllers).toHaveBeenCalledWith(['task123']);
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
        });

        it('should call photos checkAndUnsubscribe when isForPhotos is true', async () => {
            const event = {
                type: 'file:empty' as const,
                uploadId: 'task123',
                isForPhotos: true,
            };

            await handler.handleEvent(event);

            expect(mockPhotosCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
            expect(mockCheckAndUnsubscribeIfQueueEmpty).not.toHaveBeenCalled();
        });
    });

    describe('handleEvent - file:error', () => {
        it('should mark file as failed and remove controller', async () => {
            const error = new Error('Upload failed');
            const event = {
                type: 'file:error' as const,
                uploadId: 'task123',
                isForPhotos: false,
                error,
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.Failed,
                error,
            });
            expect(mockRemoveControllers).toHaveBeenCalledWith(['task123']);
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
        });

        it('should log error when file upload fails', async () => {
            const error = new Error('Upload failed');
            mockGetItem.mockReturnValue({
                uploadId: 'task123',
                name: 'test-file.pdf',
                status: UploadStatus.InProgress,
            });

            const event = {
                type: 'file:error' as const,
                uploadId: 'task123',
                isForPhotos: false,
                error,
            };

            await handler.handleEvent(event);

            expect(uploadLogError).toHaveBeenCalledWith('File upload failed', error, {
                uploadId: 'task123',
            });
        });

        it('should not mark file as failed when file is cancelled', async () => {
            mockGetItem.mockReturnValue({
                uploadId: 'task123',
                status: UploadStatus.Cancelled,
            });

            const error = new Error('Upload failed');
            const event = {
                type: 'file:error' as const,
                uploadId: 'task123',
                isForPhotos: false,
                error,
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).not.toHaveBeenCalled();
            expect(mockRemoveControllers).not.toHaveBeenCalled();
            expect(mockCheckAndUnsubscribeIfQueueEmpty).not.toHaveBeenCalled();
        });
    });

    describe('handleEvent - photo:unsupported', () => {
        it('should mark photo as not supported and unsubscribe photos activity', async () => {
            const event = {
                type: 'photo:unsupported' as const,
                uploadId: 'task123',
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.NotSupportedForPhotos,
            });
            expect(mockPhotosCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
            expect(mockCheckAndUnsubscribeIfQueueEmpty).not.toHaveBeenCalled();
        });
    });

    describe('handleEvent - file:conflict', () => {
        it('should delegate to conflict manager', async () => {
            const error = new NodeWithSameNameExistsValidationError('node123', 400);
            const event: any = {
                type: 'file:conflict' as const,
                uploadId: 'task123',
                error,
            };

            await handler.handleEvent(event);

            expect(mockConflictManager.handleConflict).toHaveBeenCalledWith('task123', error);
        });
    });

    describe('handleEvent - folder:complete', () => {
        it('should mark folder as finished', async () => {
            const event = {
                type: 'folder:complete' as const,
                uploadId: 'task123',
                nodeUid: 'node456',
                parentUid: 'parent123',
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.Finished,
                nodeUid: 'node456',
            });
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
        });

        it('should update parentUid for blocked children when folder completes', async () => {
            const mockQueue = new Map([
                [
                    'child1',
                    {
                        uploadId: 'child1',
                        parentUploadId: 'task123',
                        status: UploadStatus.Pending,
                    },
                ],
                [
                    'child2',
                    {
                        uploadId: 'child2',
                        parentUploadId: 'task123',
                        status: UploadStatus.Pending,
                    },
                ],
                [
                    'unrelated',
                    {
                        uploadId: 'unrelated',
                        parentUploadId: 'other-parent',
                        status: UploadStatus.Pending,
                    },
                ],
            ]);

            vi.mocked(useUploadQueueStore.getState).mockReturnValue({
                updateQueueItems: mockUpdateQueueItems,
                queue: mockQueue,
            } as any);

            const event = {
                type: 'folder:complete' as const,
                uploadId: 'task123',
                nodeUid: 'node456',
                parentUid: 'parent123',
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.Finished,
                nodeUid: 'node456',
            });

            expect(mockUpdateQueueItems).toHaveBeenCalledWith(['child1', 'child2'], {
                parentUid: 'node456',
            });

            expect(mockUpdateQueueItems).toHaveBeenCalledTimes(2);
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
        });

        it('should handle folder with no children', async () => {
            const mockQueue = new Map([
                [
                    'task123',
                    {
                        uploadId: 'task123',
                        status: UploadStatus.InProgress,
                    },
                ],
            ]);

            vi.mocked(useUploadQueueStore.getState).mockReturnValue({
                updateQueueItems: mockUpdateQueueItems,
                queue: mockQueue,
            } as any);

            const event = {
                type: 'folder:complete' as const,
                uploadId: 'task123',
                nodeUid: 'node456',
                parentUid: 'parent123',
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.Finished,
                nodeUid: 'node456',
            });

            expect(mockUpdateQueueItems).toHaveBeenCalledTimes(1);
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
        });
    });

    describe('handleEvent - folder:error', () => {
        it('should mark folder as failed and cancel children', async () => {
            const error = new Error('Folder creation failed');
            const event = {
                type: 'folder:error' as const,
                uploadId: 'task123',
                error,
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.Failed,
                error,
            });
            expect(mockCancelFolderChildren).toHaveBeenCalledWith('task123');
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
        });

        it('should log error when folder creation fails', async () => {
            const error = new Error('Folder creation failed');
            mockGetItem.mockReturnValue({
                uploadId: 'task123',
                name: 'My Folder',
                status: UploadStatus.InProgress,
            });

            const event = {
                type: 'folder:error' as const,
                uploadId: 'task123',
                error,
            };

            await handler.handleEvent(event);

            expect(uploadLogError).toHaveBeenCalledWith('Folder creation failed', error, {
                uploadId: 'task123',
            });
        });
    });

    describe('handleEvent - folder:conflict', () => {
        it('should delegate to conflict manager', async () => {
            const error = new NodeWithSameNameExistsValidationError('node123', 400);
            const event = {
                type: 'folder:conflict' as const,
                uploadId: 'task123',
                error,
            };

            await handler.handleEvent(event);

            expect(mockConflictManager.handleConflict).toHaveBeenCalledWith('task123', error);
        });
    });

    describe('cancel', () => {
        it('should do nothing when given no ids', () => {
            handler.cancel([]);

            expect(mockUpdateQueueItems).not.toHaveBeenCalled();
            expect(mockRemoveControllers).not.toHaveBeenCalled();
        });

        it('should abort controllers, mark all items as cancelled and remove controllers in one update', () => {
            const mockQueue = new Map([
                ['file1', { uploadId: 'file1', status: UploadStatus.InProgress }],
                ['file2', { uploadId: 'file2', status: UploadStatus.Pending }],
            ]);
            vi.mocked(useUploadQueueStore.getState).mockReturnValue({
                updateQueueItems: mockUpdateQueueItems,
                queue: mockQueue,
            } as any);

            const mockAbortController = new AbortController();
            const abortSpy = vi.spyOn(mockAbortController, 'abort');
            mockGetController.mockReturnValue({ abortController: mockAbortController });

            const mockRemoveControllers = vi.fn();
            vi.mocked(useUploadControllerStore.getState).mockReturnValue({
                getController: mockGetController,
                removeControllers: mockRemoveControllers,
            } as any);

            handler.cancel(['file1', 'file2']);

            expect(abortSpy).toHaveBeenCalledTimes(2);
            expect(mockRemoveControllers).toHaveBeenCalledWith(['file1', 'file2']);
            expect(mockUpdateQueueItems).toHaveBeenCalledWith(['file1', 'file2'], {
                status: UploadStatus.Cancelled,
            });
            expect(mockUpdateQueueItems).toHaveBeenCalledTimes(1);
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
            expect(mockPhotosCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
        });

        it('should mark children of a cancelled folder as parentCancelled unless they are cancelled themselves', () => {
            const mockQueue = new Map([
                ['folder1', { uploadId: 'folder1', status: UploadStatus.InProgress }],
                ['child1', { uploadId: 'child1', parentUploadId: 'folder1', status: UploadStatus.Pending }],
                ['child2', { uploadId: 'child2', parentUploadId: 'folder1', status: UploadStatus.Pending }],
                ['unrelated', { uploadId: 'unrelated', parentUploadId: 'other', status: UploadStatus.Pending }],
            ]);
            vi.mocked(useUploadQueueStore.getState).mockReturnValue({
                updateQueueItems: mockUpdateQueueItems,
                queue: mockQueue,
            } as any);

            const mockRemoveControllers = vi.fn();
            vi.mocked(useUploadControllerStore.getState).mockReturnValue({
                getController: mockGetController,
                removeControllers: mockRemoveControllers,
            } as any);

            // Explicitly cancel folder1 and child1 - child2 is only pulled in via the folder cascade.
            handler.cancel(['folder1', 'child1']);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith(['folder1', 'child1'], {
                status: UploadStatus.Cancelled,
            });
            expect(mockUpdateQueueItems).toHaveBeenCalledWith(['child2'], {
                status: UploadStatus.ParentCancelled,
            });
            expect(mockUpdateQueueItems).toHaveBeenCalledTimes(2);
        });

        it('should ignore ids that no longer exist in the queue', () => {
            const mockQueue = new Map([['file1', { uploadId: 'file1', status: UploadStatus.InProgress }]]);
            vi.mocked(useUploadQueueStore.getState).mockReturnValue({
                updateQueueItems: mockUpdateQueueItems,
                queue: mockQueue,
            } as any);

            const mockRemoveControllers = vi.fn();
            vi.mocked(useUploadControllerStore.getState).mockReturnValue({
                getController: mockGetController,
                removeControllers: mockRemoveControllers,
            } as any);

            handler.cancel(['file1', 'gone']);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith(['file1'], {
                status: UploadStatus.Cancelled,
            });
            expect(mockRemoveControllers).toHaveBeenCalledWith(['file1']);
        });
    });

    describe('event sequencing', () => {
        it('should handle file upload lifecycle', async () => {
            const mockController = {} as any;

            await handler.handleEvent({
                type: 'file:started',
                uploadId: 'task123',
                controller: mockController,
                isForPhotos: false,
            });

            await handler.handleEvent({
                type: 'file:progress',
                uploadId: 'task123',
                uploadedBytes: 500,
                isForPhotos: false,
            });

            await handler.handleEvent({
                type: 'file:progress',
                uploadId: 'task123',
                uploadedBytes: 1000,
                isForPhotos: false,
            });

            await handler.handleEvent({
                type: 'file:complete',
                uploadId: 'task123',
                nodeUid: 'node456',
                parentUid: 'parent123',
                isUpdatedNode: false,
                isForPhotos: false,
            });

            expect(mockSetUploadController).toHaveBeenCalledTimes(1);
            expect(mockUpdateQueueItems).toHaveBeenCalledTimes(4);
            expect(mockCapacityManager.updateProgress).toHaveBeenCalledTimes(2);
            expect(mockRemoveControllers).toHaveBeenCalledTimes(1);
        });

        it('should handle file upload with error', async () => {
            const mockController = {} as any;
            const error = new Error('Upload failed');

            await handler.handleEvent({
                type: 'file:started',
                uploadId: 'task123',
                controller: mockController,
                isForPhotos: false,
            });

            await handler.handleEvent({
                type: 'file:progress',
                uploadId: 'task123',
                uploadedBytes: 500,
                isForPhotos: false,
            });

            await handler.handleEvent({
                type: 'file:error',
                uploadId: 'task123',
                error,
                isForPhotos: false,
            });

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.Failed,
                error,
            });
            expect(mockRemoveControllers).toHaveBeenCalled();
        });

        it('should handle folder creation lifecycle', async () => {
            await handler.handleEvent({
                type: 'folder:complete',
                uploadId: 'folder123',
                nodeUid: 'folderNode456',
                parentUid: 'parent123',
            });

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('folder123', {
                status: UploadStatus.Finished,
                nodeUid: 'folderNode456',
            });
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
        });
    });
});
