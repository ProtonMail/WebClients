import { ThumbnailType } from '@protontech/drive-sdk';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { UnsupportedFormatError } from '../thumbnailError';
import { HeicHandler } from './heicHandler';

jest.mock('heic-to/csp', () => ({
    heicTo: jest.fn(),
}));

describe('HeicHandler', () => {
    let handler: HeicHandler;

    beforeEach(() => {
        handler = new HeicHandler();
        jest.clearAllMocks();
    });

    describe('canHandle', () => {
        test('Returns true for HEIC MIME types', () => {
            expect(handler.canHandle('image/heic')).toBe(true);
            expect(handler.canHandle('image/heif')).toBe(true);
        });

        test('Returns false for non-HEIC MIME types', () => {
            expect(handler.canHandle('image/jpeg')).toBe(false);
            expect(handler.canHandle('image/png')).toBe(false);
            expect(handler.canHandle('application/pdf')).toBe(false);
        });
    });

    describe('generate', () => {
        test('Throws UnsupportedFormatError when HEIC conversion fails', async () => {
            const { heicTo } = await import('heic-to/csp');
            jest.mocked(heicTo).mockRejectedValue(new Error('Conversion failed'));

            const blob = new Blob(['heic content'], { type: 'image/heic' });

            await expect(
                handler.generate(
                    blob,
                    'photo.heic',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'image/heic'
                )
            ).rejects.toThrow(UnsupportedFormatError);
        });

        test('UnsupportedFormatError includes proper context', async () => {
            const { heicTo } = await import('heic-to/csp');
            jest.mocked(heicTo).mockRejectedValue(new Error('Unsupported HEIC variant'));

            const blob = new Blob(['heic content'], { type: 'image/heic' });

            try {
                await handler.generate(
                    blob,
                    'photo.heic',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'image/heic'
                );
                fail('Should have thrown UnsupportedFormatError');
            } catch (error) {
                expect(error).toBeInstanceOf(UnsupportedFormatError);
                if (error instanceof UnsupportedFormatError) {
                    expect(error.message).toContain('HEIC format');
                    expect(error.context.stage).toBe('HEIC conversion');
                    expect(error.context.fileSize).toBe(blob.size);
                }
            }
        });

        test('Handler name is HeicHandler', () => {
            expect(handler.handlerName).toBe('HeicHandler');
        });
    });
});
