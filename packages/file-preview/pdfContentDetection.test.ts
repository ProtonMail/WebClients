import { isPdfContent } from './pdfContentDetection';

describe('isPdfContent', () => {
    const encode = (text: string) => new TextEncoder().encode(text);

    it('finds the header at the start', () => {
        expect(isPdfContent([encode('%PDF-1.3\n')])).toBe(true);
    });

    it('finds the header after some junk bytes', () => {
        expect(isPdfContent([encode('\r\n  %PDF-1.7')])).toBe(true);
    });

    it('finds the header split across chunks', () => {
        expect(isPdfContent([encode('%PD'), encode('F-1.4')])).toBe(true);
    });

    it('ignores a header past the first 1024 bytes', () => {
        expect(isPdfContent([new Uint8Array(1024), encode('%PDF-1.4')])).toBe(false);
    });

    it.each([
        { name: 'header ending on the last byte', contents: [new Uint8Array(1019), encode('%PDF-')], expected: true },
        { name: 'header crossing the limit', contents: [new Uint8Array(1020), encode('%PDF-')], expected: false },
        { name: 'header only', contents: [encode('%PDF-')], expected: true },
    ])('handles the 1024-byte window: $name', ({ contents, expected }) => {
        expect(isPdfContent(contents)).toBe(expected);
    });

    it('does not match text or empty contents', () => {
        expect(isPdfContent([encode('hello world')])).toBe(false);
        expect(isPdfContent([])).toBe(false);
    });
});
