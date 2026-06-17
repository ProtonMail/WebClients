import { couldPotentiallyBeRenderedAsSVG } from '../../lib/helpers/mimetype';

describe('mimetype', () => {
    describe('couldPotentiallyBeRenderedAsSVG', () => {
        it('matches the standard SVG mime type', () => {
            expect(couldPotentiallyBeRenderedAsSVG('image/svg+xml')).toBe(true);
        });

        it('matches legacy / alternative SVG mime types', () => {
            ['image/svg', 'application/svg+xml'].forEach((mimeType) => {
                expect(couldPotentiallyBeRenderedAsSVG(mimeType)).toBe(true);
            });
        });

        it('matches regardless of case', () => {
            ['IMAGE/SVG+XML', 'Image/Svg+Xml', 'image/SVG', 'APPLICATION/SVG+XML'].forEach((mimeType) => {
                expect(couldPotentiallyBeRenderedAsSVG(mimeType)).toBe(true);
            });
        });

        it('matches when a charset (or other parameter) is appended', () => {
            [
                'image/svg+xml; charset=utf-8',
                'image/svg+xml;charset=utf-8',
                'image/svg+xml; charset="UTF-8"',
                'image/svg; charset=utf-8',
                'application/svg+xml;charset=utf-8',
                'IMAGE/SVG+XML; charset=utf-8',
            ].forEach((mimeType) => {
                expect(couldPotentiallyBeRenderedAsSVG(mimeType)).toBe(true);
            });
        });

        it('does not match other image or document types', () => {
            [
                'image/png',
                'image/jpeg',
                'image/jpg',
                'image/gif',
                'image/webp',
                'image/avif',
                'application/pdf',
                'application/octet-stream',
                'application/json',
                'text/plain',
                'text/xml',
            ].forEach((mimeType) => {
                expect(couldPotentiallyBeRenderedAsSVG(mimeType)).toBe(false);
            });
        });

        it('does not match an empty mime type', () => {
            expect(couldPotentiallyBeRenderedAsSVG('')).toBe(false);
        });
    });
});
