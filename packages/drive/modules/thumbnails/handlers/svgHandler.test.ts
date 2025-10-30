import { SVGHandler } from './svgHandler';

describe('SVGHandler', () => {
    let handler: SVGHandler;

    beforeEach(() => {
        handler = new SVGHandler();
    });

    describe('canHandle', () => {
        test('Returns true for SVG MIME type', () => {
            expect(handler.canHandle('image/svg+xml')).toBe(true);
        });

        test('Returns false for non-SVG MIME types', () => {
            expect(handler.canHandle('image/jpeg')).toBe(false);
            expect(handler.canHandle('image/png')).toBe(false);
            expect(handler.canHandle('video/mp4')).toBe(false);
            expect(handler.canHandle('application/pdf')).toBe(false);
        });
    });

    describe('metadata', () => {
        test('Handler name is SVGHandler', () => {
            expect(handler.handlerName).toBe('SVGHandler');
        });
    });
});
