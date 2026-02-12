import { NodeType, NodeWithSameNameExistsValidationError } from '@protontech/drive-sdk';

import { CryptoProxy } from '@proton/crypto';

import { generatePhotosExtendedAttributes } from '../../extendedAttributes';
import { generateThumbnail } from '../../thumbnails';
import { UploadDriveClientRegistry } from '../UploadDriveClientRegistry';
import { useUploadControllerStore } from '../store/uploadController.store';
import type { EventCallback, PhotosUploadTask } from '../types';
import { PhotosUploadExecutor } from './PhotosUploadExecutor';

jest.mock('../UploadDriveClientRegistry');
jest.mock('../../thumbnails');
jest.mock('../../extendedAttributes');
jest.mock('../store/uploadController.store');
jest.mock('@proton/crypto', () => {
    const actual = jest.requireActual('@proton/crypto');
    return {
        ...actual,
        CryptoProxy: {
            computeHashStream: jest.fn(),
        },
    };
});
jest.mock('../utils/createFileStream', () => ({
    createFileStream: jest.fn(() => {
        return new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array([1, 2, 3]));
                controller.close();
            },
        });
    }),
}));

describe('PhotosUploadExecutor', () => {
    let executor: PhotosUploadExecutor;
    let mockEventCallback: jest.MockedFunction<EventCallback>;
    let mockUploadFromStream: jest.Mock;
    let mockCompletion: jest.Mock;
    let mockGetFileUploader: jest.Mock;
    let mockGetController: jest.Mock;

    // TODO: Remove that once jest/node include newly added toHex
    beforeAll(() => {
        if (!Uint8Array.prototype.toHex) {
            Uint8Array.prototype.toHex = function () {
                return Array.from(this)
                    .map((byte) => byte.toString(16).padStart(2, '0'))
                    .join('');
            };
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();

        mockEventCallback = jest.fn();
        mockUploadFromStream = jest.fn();
        mockCompletion = jest.fn();
        mockGetFileUploader = jest.fn();
        mockGetController = jest.fn();

        mockGetController.mockReturnValue({
            abortController: new AbortController(),
            uploadController: null,
        });

        jest.mocked(useUploadControllerStore.getState).mockReturnValue({
            getController: mockGetController,
        } as any);

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

        jest.mocked(generatePhotosExtendedAttributes).mockResolvedValue({
            metadata: {
                Media: {
                    Width: 1920,
                    Height: 1080,
                },
            },
            tags: [],
            captureTime: new Date('2024-01-01T00:00:00Z'),
        });

        jest.mocked(CryptoProxy.computeHashStream).mockResolvedValue(new Uint8Array([1, 2, 3, 4]));

        const mockFindPhotoDuplicates = jest.fn().mockResolvedValue([]);

        mockUploadFromStream.mockResolvedValue({
            completion: mockCompletion,
        });

        mockCompletion.mockResolvedValue({
            nodeUid: 'uploaded-node-123',
        });

        mockGetFileUploader.mockResolvedValue({
            uploadFromStream: mockUploadFromStream,
        });

        jest.mocked(UploadDriveClientRegistry.getDrivePhotosClient).mockReturnValue({
            getFileUploader: mockGetFileUploader,
            findPhotoDuplicates: mockFindPhotoDuplicates,
        } as any);

        executor = new PhotosUploadExecutor();
        executor.setEventCallback(mockEventCallback);
    });

    const createFileTask = (overrides?: Partial<PhotosUploadTask>): PhotosUploadTask => {
        const defaultFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(defaultFile, 'stream', {
            value: () => new ReadableStream(),
        });

        const finalFile = overrides?.file || defaultFile;
        if (finalFile && !finalFile.stream) {
            Object.defineProperty(finalFile, 'stream', {
                value: () => new ReadableStream(),
            });
        }

        return {
            uploadId: 'task123',
            type: NodeType.Photo,
            name: 'test.jpg',
            batchId: 'batch1',
            file: finalFile,
            sizeEstimate: 1000,
            isForPhotos: true,
            ...overrides,
        };
    };

    describe('setEventCallback', () => {
        it('should set event callback', () => {
            const newExecutor = new PhotosUploadExecutor();
            const callback = jest.fn();

            newExecutor.setEventCallback(callback);

            expect(callback).toBeDefined();
        });
    });

    describe('execute', () => {
        it('should check for duplicate photo before upload', async () => {
            const task = createFileTask();
            const driveForPhotos = jest.mocked(UploadDriveClientRegistry.getDrivePhotosClient)();

            await executor.execute(task);

            expect(driveForPhotos.findPhotoDuplicates).toHaveBeenCalledWith(
                'test.jpg',
                expect.any(Function),
                expect.any(AbortSignal)
            );
        });

        it('should emit photo:exist event when photo is duplicate', async () => {
            const driveForPhotos = jest.mocked(UploadDriveClientRegistry.getDrivePhotosClient)();
            jest.mocked(driveForPhotos.findPhotoDuplicates).mockResolvedValue(['duplicate-uid-123']);
            const task = createFileTask();

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith({
                type: 'photo:exist',
                uploadId: 'task123',
                duplicateUids: ['duplicate-uid-123'],
            });

            expect(mockGetFileUploader).not.toHaveBeenCalled();
        });

        it('should emit photo:exist event with multiple duplicates', async () => {
            const driveForPhotos = jest.mocked(UploadDriveClientRegistry.getDrivePhotosClient)();
            jest.mocked(driveForPhotos.findPhotoDuplicates).mockResolvedValue([
                'duplicate-uid-1',
                'duplicate-uid-2',
                'duplicate-uid-3',
            ]);
            const task = createFileTask();

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith({
                type: 'photo:exist',
                uploadId: 'task123',
                duplicateUids: ['duplicate-uid-1', 'duplicate-uid-2', 'duplicate-uid-3'],
            });

            expect(mockGetFileUploader).not.toHaveBeenCalled();
        });

        it('should upload file successfully when not duplicate', async () => {
            const task = createFileTask();

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'file:started',
                    uploadId: 'task123',
                    isForPhotos: true,
                })
            );

            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'file:complete',
                    uploadId: 'task123',
                    nodeUid: 'uploaded-node-123',
                    isForPhotos: true,
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

            mockUploadFromStream.mockImplementation((_stream, _thumbnails, onProgress) => {
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
                isForPhotos: true,
            });
        });

        it('should use getFileUploader for new file upload', async () => {
            const task = createFileTask();

            await executor.execute(task);

            const calls = mockGetFileUploader.mock.calls[0];
            expect(calls[0]).toBe('test.jpg');
            expect(calls[1]).toMatchObject({
                mediaType: 'image/jpeg',
                expectedSize: task.file.size,
            });
            expect(calls[2]).toBeInstanceOf(AbortSignal);
        });

        it('should use getFileUploader for unfinished upload', async () => {
            const task = createFileTask({ isUnfinishedUpload: true });

            await executor.execute(task);

            const calls = mockGetFileUploader.mock.calls[0];
            expect(calls[0]).toBe('test.jpg');
            expect(calls[1]).toMatchObject({
                mediaType: 'image/jpeg',
                expectedSize: task.file.size,
                overrideExistingDraftByOtherClient: true,
            });
            expect(calls[2]).toBeInstanceOf(AbortSignal);
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

            jest.mocked(generatePhotosExtendedAttributes).mockResolvedValue({
                metadata: {
                    Media: {
                        Width: 1920,
                        Height: 1080,
                        Duration: 120,
                    },
                },
                tags: [],
                captureTime: new Date('2024-01-01T00:00:00Z'),
            });

            const task = createFileTask();

            await executor.execute(task);

            const metadataArg = mockGetFileUploader.mock.calls[0][1];
            expect(metadataArg.additionalMetadata.Media).toEqual({
                Width: 1920,
                Height: 1080,
                Duration: 120,
            });

            expect(generatePhotosExtendedAttributes).toHaveBeenCalledWith(task.file, 'video/mp4', {
                width: 1920,
                height: 1080,
                duration: 120,
            });
        });

        it('should include Location metadata when available', async () => {
            jest.mocked(generatePhotosExtendedAttributes).mockResolvedValue({
                metadata: {
                    Media: {
                        Width: 1920,
                        Height: 1080,
                    },
                    Location: {
                        Latitude: 48.8566,
                        Longitude: 2.3522,
                    },
                },
                tags: [],
                captureTime: new Date('2024-01-01T00:00:00Z'),
            });

            const task = createFileTask();

            await executor.execute(task);

            const metadataArg = mockGetFileUploader.mock.calls[0][1];
            expect(metadataArg.additionalMetadata.Location).toEqual({
                Latitude: 48.8566,
                Longitude: 2.3522,
            });
        });

        it('should include Camera metadata when available', async () => {
            jest.mocked(generatePhotosExtendedAttributes).mockResolvedValue({
                metadata: {
                    Media: {
                        Width: 1920,
                        Height: 1080,
                    },
                    Camera: {
                        Device: 'iPhone 12',
                        Orientation: 1,
                        CaptureTime: '2024-01-01T00:00:00.000Z',
                        SubjectCoordinates: {
                            Top: 100,
                            Left: 100,
                            Bottom: 200,
                            Right: 200,
                        },
                    },
                },
                tags: [],
                captureTime: new Date('2024-01-01T00:00:00Z'),
            });

            const task = createFileTask();

            await executor.execute(task);

            const metadataArg = mockGetFileUploader.mock.calls[0][1];
            expect(metadataArg.additionalMetadata.Camera).toEqual({
                Device: 'iPhone 12',
                Orientation: 1,
                CaptureTime: '2024-01-01T00:00:00.000Z',
                SubjectCoordinates: {
                    Top: 100,
                    Left: 100,
                    Bottom: 200,
                    Right: 200,
                },
            });
        });

        it('should include tags metadata', async () => {
            jest.mocked(generatePhotosExtendedAttributes).mockResolvedValue({
                metadata: {
                    Media: {
                        Width: 1920,
                        Height: 1080,
                    },
                },
                tags: [1, 2, 3],
                captureTime: new Date('2024-01-01T00:00:00Z'),
            });

            const task = createFileTask();

            await executor.execute(task);

            const metadataArg = mockGetFileUploader.mock.calls[0][1];
            expect(metadataArg.tags).toEqual([1, 2, 3]);
        });

        it('should include captureTime metadata', async () => {
            const captureDate = new Date('2024-06-15T12:30:00Z');
            jest.mocked(generatePhotosExtendedAttributes).mockResolvedValue({
                metadata: {
                    Media: {
                        Width: 1920,
                        Height: 1080,
                    },
                },
                tags: [],
                captureTime: captureDate,
            });

            const task = createFileTask();

            await executor.execute(task);

            const metadataArg = mockGetFileUploader.mock.calls[0][1];
            expect(metadataArg.captureTime).toEqual(captureDate);
        });

        it('should include mainPhotoLinkID as undefined', async () => {
            const task = createFileTask();

            await executor.execute(task);

            const metadataArg = mockGetFileUploader.mock.calls[0][1];
            expect(metadataArg.mainPhotoLinkID).toBeUndefined();
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

            const uploadArgs = mockUploadFromStream.mock.calls[0];
            expect(uploadArgs[0]).toBeInstanceOf(ReadableStream);
            expect(uploadArgs[1]).toEqual([]);
            expect(typeof uploadArgs[2]).toBe('function');
        });

        it('should emit conflict event when conflict occurs', async () => {
            const task = createFileTask();
            const conflictError = Object.create(NodeWithSameNameExistsValidationError.prototype);
            conflictError.existingNodeUid = 'node123';
            conflictError.isUnfinishedUpload = false;

            mockUploadFromStream.mockRejectedValue(conflictError);

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith({
                type: 'file:conflict',
                uploadId: 'task123',
                error: conflictError,
                isForPhotos: true,
            });
        });

        it('should emit error event when upload fails', async () => {
            const task = createFileTask();
            const uploadError = new Error('Upload failed');

            mockUploadFromStream.mockRejectedValue(uploadError);

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith({
                type: 'file:error',
                uploadId: 'task123',
                error: uploadError,
                isForPhotos: true,
            });
        });

        it('should emit error event with default message for non-Error exceptions', async () => {
            const task = createFileTask();

            mockUploadFromStream.mockRejectedValue('string error');

            await executor.execute(task);

            expect(mockEventCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'file:error',
                    uploadId: 'task123',
                    error: expect.any(Error),
                    isForPhotos: true,
                })
            );
        });

        it('should use file modification time for metadata', async () => {
            const file = new File(['content'], 'test.jpg', { type: 'image/jpeg', lastModified: 1234567890 });
            const task = createFileTask({ file });

            await executor.execute(task);

            const metadataArg = mockGetFileUploader.mock.calls[0][1];
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

            const uploadArgs = mockUploadFromStream.mock.calls[0];
            expect(uploadArgs[0]).toBeInstanceOf(ReadableStream);
            expect(uploadArgs[1]).toEqual(mockThumbnails);
            expect(typeof uploadArgs[2]).toBe('function');
        });

        it('should compute SHA1 hash for duplicate detection', async () => {
            const task = createFileTask();
            const driveForPhotos = jest.mocked(UploadDriveClientRegistry.getDrivePhotosClient)();

            await executor.execute(task);

            const hashFunction = jest.mocked(driveForPhotos.findPhotoDuplicates).mock.calls[0][1];
            await hashFunction();

            expect(CryptoProxy.computeHashStream).toHaveBeenCalledWith({
                algorithm: 'unsafeSHA1',
                dataStream: expect.any(ReadableStream),
            });
        });
    });
});
