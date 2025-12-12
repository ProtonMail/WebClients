import {
    NodeType,
    NodeWithSameNameExistsValidationError,
    type NodeWithSameNameExistsValidationError as NodeWithSameNameExistsValidationErrorType,
} from '@protontech/drive-sdk';

import { useUploadQueueStore } from '../store/uploadQueue.store';
import type { FileUploadItem, FolderCreationItem } from '../types';
import { UploadConflictStrategy, UploadConflictType, UploadStatus } from '../types';
import { getBlockedChildren } from '../utils/dependencyHelpers';
import { ConflictManager } from './ConflictManager';

jest.mock('../store/uploadQueue.store', () => {
    const actual = jest.requireActual('../store/uploadQueue.store');
    return {
        ...actual,
        useUploadQueueStore: {
            getState: jest.fn(),
            subscribe: jest.fn(),
        },
    };
});
jest.mock('../utils/dependencyHelpers');
jest.mock('../../../index', () => {
    const actual = jest.requireActual('../../../index');
    return {
        ...actual,
        getDrive: jest.fn(),
    };
});

describe('ConflictManager', () => {
    let conflictManager: ConflictManager;
    let mockOnQueueEmptyCheck: jest.Mock;
    let mockGetState: jest.Mock;
    let mockUpdateQueueItems: jest.Mock;
    let mockGetItem: jest.Mock;
    let mockGetQueue: jest.Mock;
    let mockGetAvailableName: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockOnQueueEmptyCheck = jest.fn();
        mockUpdateQueueItems = jest.fn();
        mockGetItem = jest.fn();
        mockGetQueue = jest.fn().mockReturnValue([]);
        mockGetAvailableName = jest.fn().mockResolvedValue('renamed-file');

        mockGetState = jest.fn().mockReturnValue({
            updateQueueItems: mockUpdateQueueItems,
            getItem: mockGetItem,
            getQueue: mockGetQueue,
        });

        jest.mocked(useUploadQueueStore.getState).mockImplementation(mockGetState);
        jest.mocked(getBlockedChildren).mockReturnValue([]);

        const { getDrive } = require('../../../index');
        jest.mocked(getDrive).mockReturnValue({
            getAvailableName: mockGetAvailableName,
        } as any);

        conflictManager = new ConflictManager(mockOnQueueEmptyCheck);
    });

    const createConflictError = (
        existingNodeUid: string,
        isUnfinishedUpload: boolean = false
    ): NodeWithSameNameExistsValidationErrorType => {
        const error = Object.create(NodeWithSameNameExistsValidationError.prototype);
        error.existingNodeUid = existingNodeUid;
        error.isUnfinishedUpload = isUnfinishedUpload;
        return error;
    };

    const createFileItem = (
        name: string,
        status: UploadStatus,
        resolvedStrategy?: UploadConflictStrategy
    ): FileUploadItem => {
        return {
            uploadId: 'test-upload-id',
            type: NodeType.File,
            name,
            status,
            parentUid: 'parent123',
            batchId: 'batch1',
            file: new File(['content'], name),
            clearTextExpectedSize: 1000,
            lastStatusUpdateTime: new Date(),
            resolvedStrategy,
            uploadedBytes: 232,
        };
    };

    const createFolderItem = (
        name: string,
        status: UploadStatus,
        resolvedStrategy?: UploadConflictStrategy
    ): FolderCreationItem => {
        return {
            uploadId: 'test-upload-id',
            type: NodeType.Folder,
            name,
            status,
            parentUid: 'parent123',
            batchId: 'batch1',
            modificationTime: new Date(),
            lastStatusUpdateTime: new Date(),
            resolvedStrategy,
        };
    };

    describe('handleConflict', () => {
        it('should set conflict status when conflict is detected', async () => {
            const error = createConflictError('node123');
            const fileItem = createFileItem('test.txt', UploadStatus.InProgress);
            mockGetItem.mockReturnValue(fileItem);

            await conflictManager.handleConflict('task1', error);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith(
                'task1',
                expect.objectContaining({
                    status: UploadStatus.ConflictFound,
                    error,
                    conflictType: UploadConflictType.Normal,
                    nodeType: NodeType.File,
                })
            );
        });

        it('should set conflict status for draft conflict', async () => {
            const error = createConflictError('node123', true);
            const fileItem = createFileItem('test.txt', UploadStatus.InProgress);
            mockGetItem.mockReturnValue(fileItem);

            await conflictManager.handleConflict('task1', error);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith(
                'task1',
                expect.objectContaining({
                    status: UploadStatus.ConflictFound,
                    conflictType: UploadConflictType.Draft,
                })
            );
        });

        it('should not do anything if item not found', async () => {
            const error = createConflictError('node123');
            mockGetItem.mockReturnValue(undefined);

            await conflictManager.handleConflict('task1', error);

            expect(mockUpdateQueueItems).not.toHaveBeenCalled();
        });
    });

    describe('chooseConflictStrategy', () => {
        it('should resolve file conflict with rename strategy', async () => {
            const fileItem = {
                ...createFileItem('test.txt', UploadStatus.ConflictFound),
                error: createConflictError('node123'),
            };
            mockGetItem.mockReturnValue(fileItem);
            mockGetAvailableName.mockResolvedValue('test (1).txt');
            mockGetQueue.mockReturnValue([]);

            await conflictManager.chooseConflictStrategy('task1', UploadConflictStrategy.Rename);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith(
                'task1',
                expect.objectContaining({
                    name: 'test (1).txt',
                    status: UploadStatus.Pending,
                })
            );
        });

        it('should resolve folder conflict with rename strategy', async () => {
            const folderItem = {
                ...createFolderItem('MyFolder', UploadStatus.ConflictFound),
                error: createConflictError('node123'),
            };
            mockGetItem.mockReturnValue(folderItem);
            mockGetAvailableName.mockResolvedValue('MyFolder (1)');
            mockGetQueue.mockReturnValue([]);

            await conflictManager.chooseConflictStrategy('task1', UploadConflictStrategy.Rename);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith(
                'task1',
                expect.objectContaining({
                    name: 'MyFolder (1)',
                    status: UploadStatus.Pending,
                })
            );
        });

        it('should not resolve if item not found', async () => {
            mockGetItem.mockReturnValue(undefined);

            await conflictManager.chooseConflictStrategy('task1', UploadConflictStrategy.Rename);

            expect(mockUpdateQueueItems).not.toHaveBeenCalled();
        });

        it('should not resolve if item is not in ConflictFound status', async () => {
            const fileItem = createFileItem('test.txt', UploadStatus.Pending);
            mockGetItem.mockReturnValue(fileItem);

            await conflictManager.chooseConflictStrategy('task1', UploadConflictStrategy.Rename);

            expect(mockGetAvailableName).not.toHaveBeenCalled();
        });

        it('should resolve file conflict with replace strategy', async () => {
            const fileItem = {
                ...createFileItem('test.txt', UploadStatus.ConflictFound),
                error: createConflictError('existing-node-123'),
            };
            mockGetItem.mockReturnValue(fileItem);
            mockGetQueue.mockReturnValue([]);

            await conflictManager.chooseConflictStrategy('task1', UploadConflictStrategy.Replace);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith(
                'task1',
                expect.objectContaining({
                    status: UploadStatus.Pending,
                    existingNodeUid: 'existing-node-123',
                    nodeUid: undefined,
                })
            );
        });

        it('should resolve folder conflict with replace strategy and update children parentUid', async () => {
            const folderItem = {
                ...createFolderItem('MyFolder', UploadStatus.ConflictFound),
                error: createConflictError('existing-folder-456'),
            };
            mockGetItem.mockReturnValue(folderItem);
            mockGetQueue.mockReturnValue([
                folderItem,
                { uploadId: 'child1', parentUploadId: 'task1' },
                { uploadId: 'child2', parentUploadId: 'task1' },
                { uploadId: 'other', parentUploadId: 'other-parent' },
            ]);
            jest.mocked(getBlockedChildren).mockReturnValue(['child1', 'child2']);

            await conflictManager.chooseConflictStrategy('task1', UploadConflictStrategy.Replace);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith(
                'task1',
                expect.objectContaining({
                    status: UploadStatus.Finished,
                    existingNodeUid: 'existing-folder-456',
                    nodeUid: 'existing-folder-456',
                })
            );

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('child1', {
                parentUid: 'existing-folder-456',
            });

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('child2', {
                parentUid: 'existing-folder-456',
            });

            expect(mockUpdateQueueItems).toHaveBeenCalledTimes(3);
        });

        it('should resolve folder conflict with skip strategy and cancel children', async () => {
            const folderItem = {
                ...createFolderItem('MyFolder', UploadStatus.ConflictFound),
                error: createConflictError('existing-folder-456'),
            };
            mockGetItem.mockReturnValue(folderItem);
            mockGetQueue.mockReturnValue([
                folderItem,
                { uploadId: 'child1', parentUploadId: 'task1' },
                { uploadId: 'child2', parentUploadId: 'task1' },
            ]);
            jest.mocked(getBlockedChildren).mockReturnValue(['child1', 'child2']);

            await conflictManager.chooseConflictStrategy('task1', UploadConflictStrategy.Skip);

            expect(mockUpdateQueueItems).toHaveBeenCalledWith(
                'task1',
                expect.objectContaining({
                    status: UploadStatus.Skipped,
                })
            );

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('child1', {
                status: UploadStatus.ParentCancelled,
            });

            expect(mockUpdateQueueItems).toHaveBeenCalledWith('child2', {
                status: UploadStatus.ParentCancelled,
            });

            expect(mockUpdateQueueItems).toHaveBeenCalledTimes(3);
        });
    });
});
