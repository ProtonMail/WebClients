import { NodeWithSameNameExistsValidationError } from '@protontech/drive-sdk';

import type { CapacityManager } from '../scheduling/CapacityManager';
import { useUploadControllerStore } from '../store/uploadController.store';
import { useUploadQueueStore } from '../store/uploadQueue.store';
import { UploadStatus } from '../types';
import { uploadLogError } from '../utils/uploadLogger';
import type { ConflictManager } from './ConflictManager';
import type { SDKTransferActivity } from './SDKTransferActivity';
import { UploadEventHandler } from './UploadEventHandler';

jest.mock('../store/uploadController.store');
jest.mock('../store/uploadQueue.store');
jest.mock('../utils/uploadLogger');

describe('UploadEventHandler', () => {
    let handler: UploadEventHandler;
    let mockCapacityManager: jest.Mocked<CapacityManager>;
    let mockConflictManager: jest.Mocked<ConflictManager>;
    let mockSDKTransferActivity: jest.Mocked<SDKTransferActivity>;
    let mockSDKPhotosTransferActivity: jest.Mocked<SDKTransferActivity>;
    let mockCancelFolderChildren: jest.Mock;
    let mockUpdateQueueItems: jest.Mock;
    let mockSetController: jest.Mock;
    let mockSetAbortController: jest.Mock;
    let mockSetUploadController: jest.Mock;
    let mockRemoveController: jest.Mock;
    let mockGetController: jest.Mock;
    let mockCheckAndUnsubscribeIfQueueEmpty: jest.Mock;
    let mockPhotosCheckAndUnsubscribeIfQueueEmpty: jest.Mock;
    let mockGetItem: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUpdateQueueItems = jest.fn();
        mockSetController = jest.fn();
        mockSetAbortController = jest.fn();
        mockSetUploadController = jest.fn();
        mockRemoveController = jest.fn();
        mockGetController = jest.fn();
        mockCheckAndUnsubscribeIfQueueEmpty = jest.fn();
        mockPhotosCheckAndUnsubscribeIfQueueEmpty = jest.fn();
        mockCancelFolderChildren = jest.fn();
        mockGetItem = jest.fn();

        jest.mocked(useUploadQueueStore.getState).mockReturnValue({
            updateQueueItems: mockUpdateQueueItems,
            queue: new Map(),
            getItem: mockGetItem,
        } as any);

        jest.mocked(useUploadControllerStore.getState).mockReturnValue({
            setController: mockSetController,
            setAbortController: mockSetAbortController,
            setUploadController: mockSetUploadController,
            removeController: mockRemoveController,
            getController: mockGetController,
        } as any);

        mockCapacityManager = {
            updateProgress: jest.fn(),
        } as any;

        mockConflictManager = {
            handleConflict: jest.fn(),
            chooseConflictStrategy: jest.fn(),
            setBatchStrategy: jest.fn(),
        } as any;

        mockSDKTransferActivity = {
            isPaused: jest.fn().mockReturnValue(false),
            checkAndUnsubscribeIfQueueEmpty: mockCheckAndUnsubscribeIfQueueEmpty,
        } as any;

        mockSDKPhotosTransferActivity = {
            isPaused: jest.fn().mockReturnValue(false),
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

    describe('handleEvent - file:queued', () => {
        it('should set abort controller for queued file', async () => {
            const mockAbortController = new AbortController();
            const event = {
                type: 'file:queued' as const,
                uploadId: 'task123',
                abortController: mockAbortController,
                isForPhotos: false,
            };

            await handler.handleEvent(event);

            expect(mockSetAbortController).toHaveBeenCalledWith('task123', mockAbortController);
        });
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
            expect(mockRemoveController).toHaveBeenCalledWith('task123');
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
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
            expect(mockRemoveController).toHaveBeenCalledWith('task123');
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
                fileName: 'test-file.pdf',
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
            expect(mockRemoveController).not.toHaveBeenCalled();
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

            jest.mocked(useUploadQueueStore.getState).mockReturnValue({
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

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('child1', {
                parentUid: 'node456',
            });

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('child2', {
                parentUid: 'node456',
            });

            expect(mockUpdateQueueItems).toHaveBeenCalledTimes(3);
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

            jest.mocked(useUploadQueueStore.getState).mockReturnValue({
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
                folderName: 'My Folder',
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

    describe('handleEvent - file:cancelled', () => {
        it('should abort controller, mark file as cancelled and remove controller', async () => {
            const mockAbortController = new AbortController();
            const abortSpy = jest.spyOn(mockAbortController, 'abort');
            mockGetController.mockReturnValue({
                abortController: mockAbortController,
            });

            const event = {
                type: 'file:cancelled' as const,
                uploadId: 'task123',
                isForPhotos: false,
            };

            await handler.handleEvent(event);

            expect(mockGetController).toHaveBeenCalledWith('task123');
            expect(abortSpy).toHaveBeenCalled();
            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.Cancelled,
            });
            expect(mockRemoveController).toHaveBeenCalledWith('task123');
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
        });

        it('should handle cancellation when no controller exists', async () => {
            mockGetController.mockReturnValue(null);

            const event = {
                type: 'file:cancelled' as const,
                uploadId: 'task123',
                isForPhotos: false,
            };

            await handler.handleEvent(event);

            expect(mockGetController).toHaveBeenCalledWith('task123');
            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.Cancelled,
            });
            expect(mockRemoveController).toHaveBeenCalledWith('task123');
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
        });
    });

    describe('handleEvent - folder:cancelled', () => {
        it('should mark folder as cancelled and cancel children', async () => {
            const event = {
                type: 'folder:cancelled' as const,
                uploadId: 'task123',
            };

            await handler.handleEvent(event);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('task123', {
                status: UploadStatus.Cancelled,
            });
            expect(mockCancelFolderChildren).toHaveBeenCalledWith('task123');
            expect(mockCheckAndUnsubscribeIfQueueEmpty).toHaveBeenCalled();
        });
    });

    describe('event sequencing', () => {
        it('should handle file upload lifecycle', async () => {
            const mockController = {} as any;
            const mockAbortController = new AbortController();

            await handler.handleEvent({
                type: 'file:queued',
                uploadId: 'task123',
                abortController: mockAbortController,
                isForPhotos: false,
            });

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

            expect(mockSetAbortController).toHaveBeenCalledTimes(1);
            expect(mockSetUploadController).toHaveBeenCalledTimes(1);
            expect(mockUpdateQueueItems).toHaveBeenCalledTimes(3);
            expect(mockCapacityManager.updateProgress).toHaveBeenCalledTimes(2);
            expect(mockRemoveController).toHaveBeenCalledTimes(1);
        });

        it('should handle file upload with error', async () => {
            const mockController = {} as any;
            const mockAbortController = new AbortController();
            const error = new Error('Upload failed');

            await handler.handleEvent({
                type: 'file:queued',
                uploadId: 'task123',
                abortController: mockAbortController,
                isForPhotos: false,
            });

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
            expect(mockRemoveController).toHaveBeenCalled();
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
