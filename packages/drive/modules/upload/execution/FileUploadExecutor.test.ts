import { NodeType } from '@protontech/drive-sdk';

import { NodeWithSameNameExistsValidationError, getDrive } from '../../../index';
import { generateExtendedAttributes } from '../../extendedAttributes';
import { generateThumbnail } from '../../thumbnails';
import type { EventCallback, FileUploadTask } from '../types';
import { FileUploadExecutor } from './FileUploadExecutor';

jest.mock('../../../index', () => {
    const actual = jest.requireActual('../../../index');
    return {
        ...actual,
        getDrive: jest.fn(),
    };
});
jest.mock('../../thumbnails');
jest.mock('../../extendedAttributes');

describe('FileUploadExecutor', () => {
    let executor: FileUploadExecutor;
    let mockEventCallback: jest.MockedFunction<EventCallback>;
    let mockUploadFromFile: jest.Mock;
    let mockCompletion: jest.Mock;
    let mockGetFileUploader: jest.Mock;
    let mockGetFileRevisionUploader: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockEventCallback = jest.fn();
        mockUploadFromFile = jest.fn();
        mockCompletion = jest.fn();
        mockGetFileUploader = jest.fn();
        mockGetFileRevisionUploader = jest.fn();

        jest.mocked(generateThumbnail).mockReturnValue({
            thumbnailsPromise: Promise.resolve({
                ok: true,
                result: {
                    thumbnails: [],
                    width: 1920,
                    height: 1080,
                },
            }),
            mimeTypePromise: Promise.resolve('image/jpeg'),
        });

        jest.mocked(generateExtendedAttributes).mockResolvedValue({
            metadata: {
                Media: {
                    Width: 1920,
                    Height: 1080,
                },
            },
        });

        mockUploadFromFile.mockResolvedValue({
            completion: mockCompletion,
        });

        mockCompletion.mockResolvedValue({
            nodeUid: 'uploaded-node-123',
        });

        mockGetFileUploader.mockResolvedValue({
            uploadFromFile: mockUploadFromFile,
        });

        mockGetFileRevisionUploader.mockResolvedValue({
            uploadFromFile: mockUploadFromFile,
        });

        jest.mocked(getDrive).mockReturnValue({
            getFileUploader: mockGetFileUploader,
            getFileRevisionUploader: mockGetFileRevisionUploader,
        } as any);

        executor = new FileUploadExecutor();
        executor.setEventCallback(mockEventCallback);
    });

    const createFileTask = (overrides?: Partial<FileUploadTask>): FileUploadTask => {
        return {
            uploadId: 'task123',
            type: NodeType.File,
            name: 'test.jpg',
            parentUid: 'parent123',
            batchId: 'batch1',
            file: new File(['content'], 'test.jpg', { type: 'image/jpeg' }),
            sizeEstimate: 1000,
            ...overrides,
        };
    };

    describe('setEventCallback', () => {
        it('should set event callback', () => {
            const newExecutor = new FileUploadExecutor();
            const callback = jest.fn();

            newExecutor.setEventCallback(callback);

            expect(callback).toBeDefined();
        });
    });

    describe('driveClient', () => {
        it('should use getDrive by default', async () => {
            const task = createFileTask();

            await executor.execute(task);

            expect(getDrive).toHaveBeenCalled();
            expect(mockGetFileUploader).toHaveBeenCalled();
        });

        it('should use custom drive client when set', async () => {
            const customMockGetFileUploader = jest.fn().mockResolvedValue({
                uploadFromFile: mockUploadFromFile,
            });
            const customDriveClient = {
                getFileUploader: customMockGetFileUploader,
            } as any;

            executor.driveClient = customDriveClient;

            const task = createFileTask();
            await executor.execute(task);

            expect(customMockGetFileUploader).toHaveBeenCalled();
            expect(mockGetFileUploader).not.toHaveBeenCalled();
        });

        it('should persist custom drive client across multiple executions', async () => {
            const customMockGetFileUploader = jest.fn().mockResolvedValue({
                uploadFromFile: mockUploadFromFile,
            });
            const customDriveClient = {
                getFileUploader: customMockGetFileUploader,
            } as any;

            executor.driveClient = customDriveClient;

            const task1 = createFileTask({ uploadId: 'task1' });
            const task2 = createFileTask({ uploadId: 'task2' });

            await executor.execute(task1);
            await executor.execute(task2);

            expect(customMockGetFileUploader).toHaveBeenCalledTimes(2);
            expect(mockGetFileUploader).not.toHaveBeenCalled();
        });
    });

    describe('execute', () => {
        it('should upload file successfully', async () => {
            const task = createFileTask();

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'file:started',
                    uploadId: 'task123',
                    isForPhotos: false,
                })
            );

            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'file:complete',
                    uploadId: 'task123',
                    nodeUid: 'uploaded-node-123',
                    isForPhotos: false,
                })
            );
        });

        it('should generate thumbnails before upload', async () => {
            const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
            const task = createFileTask({ file });

            await executor.execute(task);

            expect(generateThumbnail).toHaveBeenCalledWith(file, 'test.jpg', file.size, { debug: false });
        });

        it('should emit progress events during upload', async () => {
            const task = createFileTask();
            let progressCallback: (uploadedBytes: number) => void = () => {};

            mockUploadFromFile.mockImplementation((_file, _thumbnails, onProgress) => {
                progressCallback = onProgress;
                return Promise.resolve({
                    completion: mockCompletion,
                });
            });

            await executor.execute(task);

            progressCallback(500);

            expect(mockEventCallback).toHaveBeenCalledWith({
                type: 'file:progress',
                uploadId: 'task123',
                uploadedBytes: 500,
                isForPhotos: false,
            });
        });

        it('should use getFileUploader for new file upload', async () => {
            const task = createFileTask();

            await executor.execute(task);

            const calls = mockGetFileUploader.mock.calls[0];
            expect(calls[0]).toBe('parent123');
            expect(calls[1]).toBe('test.jpg');
            expect(calls[2]).toMatchObject({
                mediaType: 'image/jpeg',
                expectedSize: task.file.size,
            });
            expect(calls[3]).toBeInstanceOf(AbortSignal);
        });

        it('should use getFileRevisionUploader for existing file', async () => {
            const task = createFileTask({ existingNodeUid: 'existing-node-123' });

            await executor.execute(task);

            const calls = mockGetFileRevisionUploader.mock.calls[0];
            expect(calls[0]).toBe('existing-node-123');
            expect(calls[1]).toMatchObject({
                mediaType: 'image/jpeg',
                expectedSize: task.file.size,
            });
            expect(calls[2]).toBeInstanceOf(AbortSignal);
        });

        it('should use getFileUploader for unfinished upload', async () => {
            const task = createFileTask({ existingNodeUid: 'existing-node-123', isUnfinishedUpload: true });

            await executor.execute(task);

            const calls = mockGetFileUploader.mock.calls[0];
            expect(calls[0]).toBe('parent123');
            expect(calls[1]).toBe('test.jpg');
            expect(calls[2]).toMatchObject({
                mediaType: 'image/jpeg',
                expectedSize: task.file.size,
                overrideExistingDraftByOtherClient: true,
            });
            expect(calls[3]).toBeInstanceOf(AbortSignal);
        });

        it('should include media metadata when available', async () => {
            jest.mocked(generateThumbnail).mockReturnValue({
                thumbnailsPromise: Promise.resolve({
                    ok: true,
                    result: {
                        thumbnails: [],
                        width: 1920,
                        height: 1080,
                        duration: 120,
                    },
                }),
                mimeTypePromise: Promise.resolve('video/mp4'),
            });

            jest.mocked(generateExtendedAttributes).mockResolvedValue({
                metadata: {
                    Media: {
                        Width: 1920,
                        Height: 1080,
                        Duration: 120,
                    },
                },
            });

            const task = createFileTask();

            await executor.execute(task);

            expect(generateExtendedAttributes).toHaveBeenCalledWith(task.file, 'video/mp4', {
                width: 1920,
                height: 1080,
                duration: 120,
            });

            const metadataArg = mockGetFileUploader.mock.calls[0][2];
            expect(metadataArg.additionalMetadata).toEqual({
                Media: {
                    Width: 1920,
                    Height: 1080,
                    Duration: 120,
                },
            });
        });

        it('should extract EXIF info and pass to metadata helper', async () => {
            jest.mocked(generateExtendedAttributes).mockResolvedValue({
                metadata: {
                    Media: {
                        Width: 1920,
                        Height: 1080,
                    },
                    Location: {
                        Latitude: 48.8566,
                        Longitude: 2.3522,
                    },
                    Camera: {
                        Device: 'iPhone 12',
                    },
                },
            });

            const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
            const task = createFileTask({ file });

            await executor.execute(task);

            expect(generateExtendedAttributes).toHaveBeenCalledWith(file, 'image/jpeg', {
                width: 1920,
                height: 1080,
            });

            const metadataArg = mockGetFileUploader.mock.calls[0][2];
            expect(metadataArg.additionalMetadata.Location).toEqual({
                Latitude: 48.8566,
                Longitude: 2.3522,
            });
            expect(metadataArg.additionalMetadata.Camera).toEqual({
                Device: 'iPhone 12',
            });
        });

        it('should handle thumbnail generation failure gracefully', async () => {
            jest.mocked(generateThumbnail).mockReturnValue({
                thumbnailsPromise: Promise.resolve({
                    ok: false,
                    error: new Error(),
                }),
                mimeTypePromise: Promise.resolve('image/jpeg'),
            });

            const task = createFileTask();

            await executor.execute(task);

            const uploadArgs = mockUploadFromFile.mock.calls[0];
            expect(uploadArgs[0]).toBeInstanceOf(File);
            expect(uploadArgs[1]).toEqual([]);
            expect(typeof uploadArgs[2]).toBe('function');
        });

        it('should emit conflict event when conflict occurs', async () => {
            const task = createFileTask();
            const conflictError = Object.create(NodeWithSameNameExistsValidationError.prototype);
            conflictError.existingNodeUid = 'node123';
            conflictError.isUnfinishedUpload = false;

            mockUploadFromFile.mockRejectedValue(conflictError);

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith({
                type: 'file:conflict',
                uploadId: 'task123',
                error: conflictError,
                isForPhotos: false,
            });
        });

        it('should emit error event when upload fails', async () => {
            const task = createFileTask();
            const uploadError = new Error('Upload failed');

            mockUploadFromFile.mockRejectedValue(uploadError);

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith({
                type: 'file:error',
                uploadId: 'task123',
                error: uploadError,
                isForPhotos: false,
            });
        });

        it('should emit error event with default message for non-Error exceptions', async () => {
            const task = createFileTask();

            mockUploadFromFile.mockRejectedValue('string error');

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'file:error',
                    uploadId: 'task123',
                    error: expect.any(Error),
                    isForPhotos: false,
                })
            );
        });

        it('should use file modification time for metadata', async () => {
            const file = new File(['content'], 'test.jpg', { type: 'image/jpeg', lastModified: 1234567890 });
            const task = createFileTask({ file });

            await executor.execute(task);

            const metadataArg = mockGetFileUploader.mock.calls[0][2];
            expect(metadataArg.modificationTime).toEqual(new Date(1234567890));
        });

        it('should pass thumbnails to upload', async () => {
            const mockThumbnails = [{ type: 1, thumbnail: new Uint8Array() }];
            jest.mocked(generateThumbnail).mockReturnValue({
                thumbnailsPromise: Promise.resolve({
                    ok: true,
                    result: {
                        thumbnails: mockThumbnails,
                    },
                }),
                mimeTypePromise: Promise.resolve('image/jpeg'),
            });

            const task = createFileTask();

            await executor.execute(task);

            const uploadArgs = mockUploadFromFile.mock.calls[0];
            expect(uploadArgs[0]).toBeInstanceOf(File);
            expect(uploadArgs[1]).toEqual(mockThumbnails);
            expect(typeof uploadArgs[2]).toBe('function');
        });
    });
});
