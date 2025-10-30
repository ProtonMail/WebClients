import { ThumbnailType } from '@protontech/drive-sdk';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { UnsupportedFormatError } from '../thumbnailError';
import { VideoHandler } from './videoHandler';

describe('VideoHandler', () => {
    let handler: VideoHandler;

    beforeEach(() => {
        handler = new VideoHandler();
    });

    describe('canHandle', () => {
        test('Returns true for video MIME types', () => {
            expect(handler.canHandle('video/mp4')).toBe(true);
            expect(handler.canHandle('video/webm')).toBe(true);
            expect(handler.canHandle('video/quicktime')).toBe(true);
            expect(handler.canHandle('video/x-msvideo')).toBe(true);
        });

        test('Returns false for non-video MIME types', () => {
            expect(handler.canHandle('image/jpeg')).toBe(false);
            expect(handler.canHandle('application/pdf')).toBe(false);
            expect(handler.canHandle('text/plain')).toBe(false);
        });
    });

    describe('generate', () => {
        test('Throws UnsupportedFormatError when video extraction fails', async () => {
            const blob = new Blob(['video content'], { type: 'video/mp4' });

            await expect(
                handler.generate(blob, 'corrupted.mp4', blob.size, SupportedMimeTypes.webp, [ThumbnailType.Type1])
            ).rejects.toThrow(UnsupportedFormatError);
        });

        test('UnsupportedFormatError includes proper context', async () => {
            const blob = new Blob(['video content'], { type: 'video/mp4' });

            try {
                await handler.generate(blob, 'test.mp4', blob.size, SupportedMimeTypes.webp, [ThumbnailType.Type1]);
                fail('Should have thrown UnsupportedFormatError');
            } catch (error) {
                expect(error).toBeInstanceOf(UnsupportedFormatError);
                if (error instanceof UnsupportedFormatError) {
                    expect(error.message).toContain('video codec');
                    expect(error.context.stage).toBe('video frame extraction');
                    expect(error.context.fileSize).toBe(blob.size);
                    expect(error.context.mimeType).toBe('video/mp4');
                }
            }
        });

        test('Handler name is VideoHandler', () => {
            expect(handler.handlerName).toBe('VideoHandler');
        });
    });
});
