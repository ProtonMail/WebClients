import { ThumbnailType } from '@protontech/drive-sdk';
import type { MockedFunction } from 'vitest';

import type { createWorker } from '@proton/raw-images/createWorker';
import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import * as constants from '../constants';
import { FileTooLargeError, MissingDataError, UnsupportedFormatError } from '../thumbnailError';
import { RawImageHandler } from './rawImageHandler';

vi.mock('@proton/raw-images/createWorker', () => ({
    createWorker: vi.fn(),
}));

vi.mock('../constants', async () => ({
    ...(await vi.importActual('../constants')),
    isIosDevice: false,
    MAX_MEDIA_SIZE_FOR_THUMBNAIL_IOS: 100 * 1024 * 1024,
}));

describe('RawImageHandler', () => {
    let handler: RawImageHandler;
    let mockCreateWorker: MockedFunction<typeof createWorker>;

    beforeEach(async () => {
        handler = new RawImageHandler();
        vi.clearAllMocks();

        const rawImagesModule = await import('@proton/raw-images/createWorker');
        mockCreateWorker = vi.mocked(rawImagesModule.createWorker);
    });

    describe('canHandle', () => {
        test('Returns true for RAW image MIME types', () => {
            expect(handler.canHandle('image/x-nikon-nef', 'photo.nef')).toBe(true);
            expect(handler.canHandle('image/x-canon-cr2', 'photo.cr2')).toBe(true);
            expect(handler.canHandle('image/x-sony-arw', 'photo.arw')).toBe(true);
        });

        test('Returns true for files with RAW extensions', () => {
            expect(handler.canHandle('application/octet-stream', 'photo.nef')).toBe(true);
            expect(handler.canHandle('application/octet-stream', 'photo.cr2')).toBe(true);
            expect(handler.canHandle('application/octet-stream', 'photo.dng')).toBe(true);
        });

        test('Returns false for non-RAW files', () => {
            expect(handler.canHandle('image/jpeg', 'photo.jpg')).toBe(false);
            expect(handler.canHandle('image/png', 'photo.png')).toBe(false);
            expect(handler.canHandle('application/pdf', 'document.pdf')).toBe(false);
        });
    });

    describe('generate', () => {
        test('Throws FileTooLargeError for large RAW images on iOS', async () => {
            Object.defineProperty(constants, 'isIosDevice', { value: true, writable: true });

            const largeSize = 150 * 1024 * 1024; // 150MB, exceeds 100MB limit
            const blob = new Blob(['raw content'], { type: 'image/x-nikon-nef' });

            await expect(
                handler.generate(
                    blob,
                    'large.nef',
                    largeSize,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'image/x-nikon-nef'
                )
            ).rejects.toThrow(FileTooLargeError);

            Object.defineProperty(constants, 'isIosDevice', { value: false, writable: true });
        });

        test('Throws MissingDataError when RAW has no embedded thumbnail', async () => {
            const mockTerminate = vi.fn();
            const mockInitialize = vi.fn().mockResolvedValue(undefined);
            const mockExtractThumbnail = vi.fn().mockResolvedValue(null);

            mockCreateWorker.mockResolvedValue({
                initialize: mockInitialize,
                extractThumbnail: mockExtractThumbnail,
                terminate: mockTerminate,
            } as any);

            const blob = new Blob(['raw content'], { type: 'image/x-nikon-nef' });
            blob.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

            await expect(
                handler.generate(
                    blob,
                    'photo.nef',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'image/x-nikon-nef'
                )
            ).rejects.toThrow(MissingDataError);

            expect(mockTerminate).toHaveBeenCalled();
        });

        test('MissingDataError includes proper context', async () => {
            const mockTerminate = vi.fn();
            const mockInitialize = vi.fn().mockResolvedValue(undefined);
            const mockExtractThumbnail = vi.fn().mockResolvedValue(null);

            mockCreateWorker.mockResolvedValue({
                initialize: mockInitialize,
                extractThumbnail: mockExtractThumbnail,
                terminate: mockTerminate,
            } as any);

            const blob = new Blob(['raw content'], { type: 'image/x-nikon-nef' });
            blob.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

            try {
                await handler.generate(
                    blob,
                    'photo.nef',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'image/x-nikon-nef'
                );
                expect.unreachable('Should have thrown MissingDataError');
            } catch (error) {
                expect(error).toBeInstanceOf(MissingDataError);
                if (error instanceof MissingDataError) {
                    expect(error.message).toContain('RAW embedded thumbnail');
                    expect(error.context.stage).toBe('RAW thumbnail extraction');
                }
            }

            expect(mockTerminate).toHaveBeenCalled();
        });

        test('Throws UnsupportedFormatError when RAW processing fails', async () => {
            const mockTerminate = vi.fn();
            const mockInitialize = vi.fn().mockResolvedValue(undefined);
            const mockExtractThumbnail = vi.fn().mockRejectedValue(new Error('Unsupported RAW format'));

            mockCreateWorker.mockResolvedValue({
                initialize: mockInitialize,
                extractThumbnail: mockExtractThumbnail,
                terminate: mockTerminate,
            } as any);

            const blob = new Blob(['corrupted raw'], { type: 'image/x-nikon-nef' });
            blob.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

            await expect(
                handler.generate(
                    blob,
                    'corrupted.nef',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'image/x-nikon-nef'
                )
            ).rejects.toThrow(UnsupportedFormatError);

            expect(mockTerminate).toHaveBeenCalled();
        });

        test('UnsupportedFormatError includes proper context', async () => {
            const mockTerminate = vi.fn();
            const mockInitialize = vi.fn().mockResolvedValue(undefined);
            const mockExtractThumbnail = vi.fn().mockRejectedValue(new Error('Processing failed'));

            mockCreateWorker.mockResolvedValue({
                initialize: mockInitialize,
                extractThumbnail: mockExtractThumbnail,
                terminate: mockTerminate,
            } as any);

            const blob = new Blob(['corrupted raw'], { type: 'image/x-nikon-nef' });
            blob.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

            try {
                await handler.generate(
                    blob,
                    'corrupted.nef',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'image/x-nikon-nef'
                );
                expect.unreachable('Should have thrown UnsupportedFormatError');
            } catch (error) {
                expect(error).toBeInstanceOf(UnsupportedFormatError);
                if (error instanceof UnsupportedFormatError) {
                    expect(error.message).toContain('RAW image format');
                    expect(error.context.stage).toBe('RAW image processing');
                }
            }

            expect(mockTerminate).toHaveBeenCalled();
        });

        test('Worker is terminated even on success', async () => {
            const mockTerminate = vi.fn();
            const mockInitialize = vi.fn().mockResolvedValue(undefined);
            const mockExtractThumbnail = vi.fn().mockResolvedValue(new Uint8Array([0xff, 0xd8, 0xff]));

            mockCreateWorker.mockResolvedValue({
                initialize: mockInitialize,
                extractThumbnail: mockExtractThumbnail,
                terminate: mockTerminate,
            } as any);

            const blob = new Blob(['raw content'], { type: 'image/x-nikon-nef' });
            blob.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
            // The DOM never loads images: make loading the extracted thumbnail fail right away.
            const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
                throw new Error('Image loading is not supported');
            });

            try {
                await handler.generate(
                    blob,
                    'photo.nef',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'image/x-nikon-nef'
                );
            } catch {
                // Expected to fail on image loading
            }

            createObjectURL.mockRestore();
            expect(mockTerminate).toHaveBeenCalled();
        });

        test('Handler name is RawImageHandler', () => {
            expect(handler.handlerName).toBe('RawImageHandler');
        });
    });
});
