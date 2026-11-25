import { ThumbnailType } from '@protontech/drive-sdk';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { FileLoadError, FileTooLargeError } from '../thumbnailError';
import { ImageHandler } from './imageHandler';
import { getImageFromFile } from './utils/getImageFromFile';

vi.mock('./utils/getImageFromFile', () => ({
    getImageFromFile: vi.fn(),
}));

const generate = (handler: ImageHandler, fileSize: number) =>
    handler.generate(
        new Blob(['image'], { type: 'image/png' }),
        'image.png',
        fileSize,
        SupportedMimeTypes.webp,
        [ThumbnailType.Type1],
        'image/png'
    );

describe('ImageHandler', () => {
    let handler: ImageHandler;

    beforeEach(() => {
        vi.clearAllMocks();
        handler = new ImageHandler();
    });

    describe('canHandle', () => {
        test('Returns true for supported image MIME types', () => {
            expect(handler.canHandle('image/jpeg')).toBe(true);
            expect(handler.canHandle('image/png')).toBe(true);
            expect(handler.canHandle('image/gif')).toBe(true);
            expect(handler.canHandle('image/webp')).toBe(true);
            expect(handler.canHandle('image/bmp')).toBe(true);
        });

        test('Returns false for non-image MIME types', () => {
            expect(handler.canHandle('video/mp4')).toBe(false);
            expect(handler.canHandle('application/pdf')).toBe(false);
            expect(handler.canHandle('text/plain')).toBe(false);
        });

        test('Returns false for SVG (handled by SVGHandler)', () => {
            expect(handler.canHandle('image/svg+xml')).toBe(false);
        });

        test('Returns false for HEIC (handled by HeicHandler)', () => {
            expect(handler.canHandle('image/heic')).toBe(false);
        });

        test('Returns false for RAW formats (handled by RawImageHandler)', () => {
            expect(handler.canHandle('image/x-nikon-nef')).toBe(false);
            expect(handler.canHandle('image/x-canon-cr2')).toBe(false);
        });
    });

    describe('metadata', () => {
        test('Handler name is ImageHandler', () => {
            expect(handler.handlerName).toBe('ImageHandler');
        });
    });

    describe('generate', () => {
        test('Throws FileTooLargeError without decoding images over 100 MB', async () => {
            await expect(generate(handler, 100 * 1024 * 1024 + 1)).rejects.toThrow(FileTooLargeError);
            expect(getImageFromFile).not.toHaveBeenCalled();
        });

        test('Decodes images of 100 MB or less', async () => {
            vi.mocked(getImageFromFile).mockRejectedValue(new Error('decode stopped by the test'));

            await expect(generate(handler, 100 * 1024 * 1024)).rejects.toThrow(FileLoadError);
            expect(getImageFromFile).toHaveBeenCalled();
        });
    });
});
