import { ImageHandler } from './imageHandler';

describe('ImageHandler', () => {
    let handler: ImageHandler;

    beforeEach(() => {
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
});
