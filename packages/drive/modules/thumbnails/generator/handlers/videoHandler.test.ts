import { ThumbnailType } from '@protontech/drive-sdk';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import * as constants from '../constants';
import { UnsupportedFormatError } from '../thumbnailError';
import { VideoHandler } from './videoHandler';

jest.mock('../constants', () => ({
    ...jest.requireActual('../constants'),
    isIosDevice: false,
    MAX_VIDEO_SIZE_FOR_THUMBNAIL_IOS: 500 * 1024 * 1024,
}));

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
        test('Throws UnsupportedFormatError for HEVC video (hev1 in MP4)', async () => {
            // Build a blob containing the 'hev1' codec identifier
            const header = new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x68, 0x65, 0x76, 0x31]); // ...hev1
            const blob = new Blob([header], { type: 'video/mp4' });

            await expect(
                handler.generate(
                    blob,
                    'hevc.mp4',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'video/mp4'
                )
            ).rejects.toThrow(UnsupportedFormatError);
        });

        test('Throws UnsupportedFormatError for HEVC video (hvc1 in MP4)', async () => {
            const header = new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x68, 0x76, 0x63, 0x31]); // ...hvc1
            const blob = new Blob([header], { type: 'video/mp4' });

            await expect(
                handler.generate(
                    blob,
                    'hevc.mp4',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'video/mp4'
                )
            ).rejects.toThrow(UnsupportedFormatError);
        });

        test('Throws UnsupportedFormatError for HEVC video in MKV container', async () => {
            const codecId = new TextEncoder().encode('V_MPEGH/ISO/HEVC');
            const padding = new Uint8Array(16);
            const blob = new Blob([padding, codecId], { type: 'video/x-matroska' });

            await expect(
                handler.generate(
                    blob,
                    'hevc.mkv',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'video/x-matroska'
                )
            ).rejects.toThrow(UnsupportedFormatError);
        });

        test('Throws UnsupportedFormatError for large videos on iOS', async () => {
            Object.defineProperty(constants, 'isIosDevice', { value: true, writable: true });

            const largeSize = 600 * 1024 * 1024; // 600MB, exceeds 500MB limit
            const blob = new Blob(['video content'], { type: 'video/mp4' });

            await expect(
                handler.generate(
                    blob,
                    'large.mp4',
                    largeSize,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'video/mp4'
                )
            ).rejects.toThrow(UnsupportedFormatError);

            Object.defineProperty(constants, 'isIosDevice', { value: false, writable: true });
        });

        test('Throws UnsupportedFormatError when browser cannot play the video format', async () => {
            const originalCreateElement = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
                const element = originalCreateElement(tagName);
                if (tagName === 'video') {
                    (element as HTMLVideoElement).canPlayType = jest.fn().mockReturnValue('');
                }
                return element;
            });

            const blob = new Blob(['video content'], { type: 'video/x-matroska' });

            await expect(
                handler.generate(
                    blob,
                    'test.mkv',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'video/x-matroska'
                )
            ).rejects.toThrow(UnsupportedFormatError);

            jest.restoreAllMocks();
        });

        test('Falls back to video/mp4 canPlayType check for video/quicktime', async () => {
            const originalCreateElement = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
                const element = originalCreateElement(tagName);
                if (tagName === 'video') {
                    (element as HTMLVideoElement).canPlayType = jest.fn().mockImplementation((mime: string) => {
                        if (mime === 'video/quicktime') {
                            return '';
                        }
                        if (mime === 'video/mp4') {
                            return 'probably';
                        }
                        return '';
                    });
                }
                return element;
            });

            const blob = new Blob(['video content'], { type: 'video/quicktime' });

            // Should not throw UnsupportedFormatError for canPlayType — it falls
            // through to video frame extraction which throws a different error in
            // the test environment (no real video data).
            await expect(
                handler.generate(
                    blob,
                    'test.mov',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'video/quicktime'
                )
            ).rejects.not.toThrow(
                expect.objectContaining({
                    message: expect.stringContaining('video format not supported by browser'),
                })
            );

            jest.restoreAllMocks();
        });

        test('Throws UnsupportedFormatError when video extraction fails', async () => {
            const blob = new Blob(['video content'], { type: 'video/mp4' });

            await expect(
                handler.generate(
                    blob,
                    'corrupted.mp4',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'video/mp4'
                )
            ).rejects.toThrow(UnsupportedFormatError);
        });

        test('UnsupportedFormatError includes proper context for canPlayType rejection', async () => {
            const blob = new Blob(['video content'], { type: 'video/mp4' });

            try {
                await handler.generate(
                    blob,
                    'test.mp4',
                    blob.size,
                    SupportedMimeTypes.webp,
                    [ThumbnailType.Type1],
                    'video/mp4'
                );
                fail('Should have thrown UnsupportedFormatError');
            } catch (error) {
                expect(error).toBeInstanceOf(UnsupportedFormatError);
                if (error instanceof UnsupportedFormatError) {
                    expect(error.message).toContain('video format not supported by browser');
                    expect(error.context.stage).toBe('canPlayType check');
                    expect(error.context.originalMimeType).toBe('video/mp4');
                }
            }
        });

        test('Handler name is VideoHandler', () => {
            expect(handler.handlerName).toBe('VideoHandler');
        });
    });
});
