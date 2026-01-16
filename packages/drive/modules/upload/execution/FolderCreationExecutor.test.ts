import { NodeType, NodeWithSameNameExistsValidationError } from '@protontech/drive-sdk';

import { UploadDriveClientRegistry } from '../UploadDriveClientRegistry';
import type { EventCallback, UploadTask } from '../types';
import { getNodeEntityFromMaybeNode } from '../utils/getNodeEntityFromMaybeNode';
import { FolderCreationExecutor } from './FolderCreationExecutor';

jest.mock('../UploadDriveClientRegistry');
jest.mock('../utils/getNodeEntityFromMaybeNode');

describe('FolderCreationExecutor', () => {
    let executor: FolderCreationExecutor;
    let mockEventCallback: jest.MockedFunction<EventCallback>;
    let mockCreateFolder: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockEventCallback = jest.fn();
        mockCreateFolder = jest.fn();

        jest.mocked(UploadDriveClientRegistry.getDriveClient).mockReturnValue({
            createFolder: mockCreateFolder,
        } as any);

        jest.mocked(getNodeEntityFromMaybeNode).mockReturnValue({
            node: {
                uid: 'created-folder-123',
                name: 'MyFolder',
            },
        } as any);

        executor = new FolderCreationExecutor();
        executor.setEventCallback(mockEventCallback);
    });

    const createFolderTask = (
        overrides?: Partial<UploadTask & { type: NodeType.Folder }>
    ): UploadTask & { type: NodeType.Folder } => {
        return {
            uploadId: 'task123',
            type: NodeType.Folder,
            name: 'MyFolder',
            parentUid: 'parent123',
            batchId: 'batch1',
            modificationTime: new Date('2024-01-01'),
            ...overrides,
        };
    };

    describe('setEventCallback', () => {
        it('should set event callback', () => {
            const newExecutor = new FolderCreationExecutor();
            const callback = jest.fn();

            newExecutor.setEventCallback(callback);

            expect(callback).toBeDefined();
        });
    });

    describe('execute', () => {
        it('should create folder successfully', async () => {
            const task = createFolderTask();
            mockCreateFolder.mockResolvedValue({});

            await executor.execute(task);

            expect(mockCreateFolder).toHaveBeenCalledWith('parent123', 'MyFolder', new Date('2024-01-01'));

            expect(mockEventCallback).toHaveBeenCalledWith({
                type: 'folder:complete',
                uploadId: 'task123',
                nodeUid: 'created-folder-123',
            });
        });

        it('should use correct parent UID', async () => {
            const task = createFolderTask({ parentUid: 'different-parent-456' });
            mockCreateFolder.mockResolvedValue({});

            await executor.execute(task);

            const calls = mockCreateFolder.mock.calls[0];
            expect(calls[0]).toBe('different-parent-456');
            expect(calls[1]).toBe('MyFolder');
            expect(calls[2]).toBeInstanceOf(Date);
        });

        it('should use correct folder name', async () => {
            const task = createFolderTask({ name: 'CustomFolderName' });
            mockCreateFolder.mockResolvedValue({});

            await executor.execute(task);

            const calls = mockCreateFolder.mock.calls[0];
            expect(calls[0]).toBe('parent123');
            expect(calls[1]).toBe('CustomFolderName');
            expect(calls[2]).toBeInstanceOf(Date);
        });

        it('should use correct modification time', async () => {
            const modTime = new Date('2023-12-25T10:30:00Z');
            const task = createFolderTask({ modificationTime: modTime });
            mockCreateFolder.mockResolvedValue({});

            await executor.execute(task);

            const calls = mockCreateFolder.mock.calls[0];
            expect(calls[0]).toBe('parent123');
            expect(calls[1]).toBe('MyFolder');
            expect(calls[2]).toEqual(modTime);
        });

        it('should extract node UID from created folder', async () => {
            const task = createFolderTask();
            const folderResult = { someData: 'value' };
            mockCreateFolder.mockResolvedValue(folderResult);

            await executor.execute(task);

            expect(getNodeEntityFromMaybeNode).toHaveBeenCalledWith(folderResult);
            expect(mockEventCallback).toHaveBeenCalledWith({
                type: 'folder:complete',
                uploadId: 'task123',
                nodeUid: 'created-folder-123',
            });
        });

        it('should emit conflict event when folder already exists', async () => {
            const task = createFolderTask();
            const conflictError = new NodeWithSameNameExistsValidationError('node123', 400);

            mockCreateFolder.mockRejectedValue(conflictError);

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith({
                type: 'folder:conflict',
                uploadId: 'task123',
                error: conflictError,
            });
        });

        it('should emit error event when folder creation fails', async () => {
            const task = createFolderTask();
            const creationError = new Error('Folder creation failed');

            mockCreateFolder.mockRejectedValue(creationError);

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith({
                type: 'folder:error',
                uploadId: 'task123',
                error: creationError,
            });
        });

        it('should emit error event with default message for non-Error exceptions', async () => {
            const task = createFolderTask();

            mockCreateFolder.mockRejectedValue('string error');

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'folder:error',
                    uploadId: 'task123',
                    error: expect.objectContaining({
                        message: 'Folder creation failed',
                    }),
                })
            );
        });

        it('should handle multiple folder creations', async () => {
            const task1 = createFolderTask({ uploadId: 'task1', name: 'Folder1' });
            const task2 = createFolderTask({ uploadId: 'task2', name: 'Folder2' });

            mockCreateFolder.mockResolvedValue({});

            await executor.execute(task1);
            await executor.execute(task2);

            expect(mockCreateFolder).toHaveBeenCalledTimes(2);
            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'folder:complete',
                    uploadId: 'task1',
                })
            );
            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'folder:complete',
                    uploadId: 'task2',
                })
            );
        });

        it('should handle conflict after multiple successful creations', async () => {
            const task1 = createFolderTask({ uploadId: 'task1', name: 'Folder1' });
            const task2 = createFolderTask({ uploadId: 'task2', name: 'Folder2' });

            mockCreateFolder
                .mockResolvedValueOnce({})
                .mockRejectedValueOnce(new NodeWithSameNameExistsValidationError('node456', 400));

            await executor.execute(task1);
            await executor.execute(task2);

            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'folder:complete',
                    uploadId: 'task1',
                })
            );
            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'folder:conflict',
                    uploadId: 'task2',
                })
            );
        });

        it('should distinguish between NodeWithSameNameExistsValidationError and other errors', async () => {
            const task = createFolderTask();
            const conflictError = new NodeWithSameNameExistsValidationError('node123', 400);
            const genericError = new Error('Network error');

            mockCreateFolder.mockRejectedValueOnce(conflictError);
            await executor.execute(task);
            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'folder:conflict',
                })
            );

            mockEventCallback.mockClear();

            mockCreateFolder.mockRejectedValueOnce(genericError);
            await executor.execute(task);
            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'folder:error',
                })
            );
        });
    });
});
