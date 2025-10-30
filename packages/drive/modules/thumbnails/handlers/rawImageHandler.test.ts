import { ThumbnailType } from '@protontech/drive-sdk';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { MissingDataError, UnsupportedFormatError } from '../thumbnailError';
import { RawImageHandler } from './rawImageHandler';

jest.mock('@proton/raw-images/src', () => ({
    createWorker: jest.fn(),
}));

describe('RawImageHandler', () => {
    let handler: RawImageHandler;

    beforeEach(async () => {
        handler = new RawImageHandler();
        jest.clearAllMocks();

        const { createWorker } = await import('@proton/raw-images/src');
        const mockTerminate = jest.fn();
        const mockInitialize = jest.fn().mockResolvedValue(undefined);
        const mockExtractThumbnail = jest.fn();

        jest.mocked(createWorker).mockResolvedValue({
            initialize: mockInitialize,
            extractThumbnail: mockExtractThumbnail,
            terminate: mockTerminate,
        } as any);
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
        test('Throws MissingDataError when RAW has no embedded thumbnail', async () => {
            const { createWorker } = await import('@proton/raw-images/src');
            const mockTerminate = jest.fn();
            jest.mocked(createWorker).mockResolvedValue({
                initialize: jest.fn().mockResolvedValue(undefined),
                extractThumbnail: jest.fn().mockResolvedValue(null),
                terminate: mockTerminate,
            } as any);

            const blob = new Blob(['raw content'], { type: 'image/x-nikon-nef' });

            await expect(
                handler.generate(blob, 'photo.nef', blob.size, SupportedMimeTypes.webp, [ThumbnailType.Type1])
            ).rejects.toThrow(MissingDataError);

            expect(mockTerminate).toHaveBeenCalled();
        });

        test('MissingDataError includes proper context', async () => {
            const { createWorker } = await import('@proton/raw-images/src');
            const mockTerminate = jest.fn();
            jest.mocked(createWorker).mockResolvedValue({
                initialize: jest.fn().mockResolvedValue(undefined),
                extractThumbnail: jest.fn().mockResolvedValue(null),
                terminate: mockTerminate,
            } as any);

            const blob = new Blob(['raw content'], { type: 'image/x-nikon-nef' });

            try {
                await handler.generate(blob, 'photo.nef', blob.size, SupportedMimeTypes.webp, [ThumbnailType.Type1]);
                fail('Should have thrown MissingDataError');
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
            const { createWorker } = await import('@proton/raw-images/src');
            const mockTerminate = jest.fn();
            jest.mocked(createWorker).mockResolvedValue({
                initialize: jest.fn().mockResolvedValue(undefined),
                extractThumbnail: jest.fn().mockRejectedValue(new Error('Unsupported RAW format')),
                terminate: mockTerminate,
            } as any);

            const blob = new Blob(['corrupted raw'], { type: 'image/x-nikon-nef' });

            await expect(
                handler.generate(blob, 'corrupted.nef', blob.size, SupportedMimeTypes.webp, [ThumbnailType.Type1])
            ).rejects.toThrow(UnsupportedFormatError);

            expect(mockTerminate).toHaveBeenCalled();
        });

        test('UnsupportedFormatError includes proper context', async () => {
            const { createWorker } = await import('@proton/raw-images/src');
            const mockTerminate = jest.fn();
            jest.mocked(createWorker).mockResolvedValue({
                initialize: jest.fn().mockResolvedValue(undefined),
                extractThumbnail: jest.fn().mockRejectedValue(new Error('Processing failed')),
                terminate: mockTerminate,
            } as any);

            const blob = new Blob(['corrupted raw'], { type: 'image/x-nikon-nef' });

            try {
                await handler.generate(blob, 'corrupted.nef', blob.size, SupportedMimeTypes.webp, [
                    ThumbnailType.Type1,
                ]);
                fail('Should have thrown UnsupportedFormatError');
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
            const { createWorker } = await import('@proton/raw-images/src');
            const mockTerminate = jest.fn();
            jest.mocked(createWorker).mockResolvedValue({
                initialize: jest.fn().mockResolvedValue(undefined),
                extractThumbnail: jest.fn().mockResolvedValue(new Uint8Array([0xff, 0xd8, 0xff])),
                terminate: mockTerminate,
            } as any);

            const blob = new Blob(['raw content'], { type: 'image/x-nikon-nef' });

            try {
                await handler.generate(blob, 'photo.nef', blob.size, SupportedMimeTypes.webp, [ThumbnailType.Type1]);
            } catch {
                // Expected to fail on image loading
            }

            expect(mockTerminate).toHaveBeenCalled();
        });

        test('Handler name is RawImageHandler', () => {
            expect(handler.handlerName).toBe('RawImageHandler');
        });
    });
});
