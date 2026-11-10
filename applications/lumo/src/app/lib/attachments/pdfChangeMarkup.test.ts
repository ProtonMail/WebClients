import type { DecorationLine, PdfOps } from './pdfChangeMarkup';
import {
    buildChangeDigest,
    countPdfPages,
    extractChangeDigest,
    formatPageMarker,
    extractDecorationLines,
    isColourful,
    markItem,
    mergeAdjacentMarkers,
} from './pdfChangeMarkup';

const OPS: PdfOps = {
    save: 10,
    restore: 11,
    transform: 12,
    setFillRGBColor: 13,
    setStrokeRGBColor: 14,
    constructPath: 15,
    endPath: 28,
    stroke: 20,
    closeStroke: 21,
    fill: 22,
    eoFill: 23,
    fillStroke: 24,
    eoFillStroke: 25,
    closeFillStroke: 26,
    closeEOFillStroke: 27,
};

/** A closed rectangle in pdf.js path encoding (moveTo, 3x lineTo, closePath). */
const rect = (x: number, y: number, w: number, h: number) => [
    0, x, y, 1, x + w, y, 1, x + w, y + h, 1, x, y + h, 4,
];

describe('isColourful', () => {
    it('ignores black, white, grey and hyperlink blue', () => {
        ['#000000', '#ffffff', '#9d9d9c', '#595959', '#0563c1'].forEach((color) => {
            expect(isColourful(color)).toBe(false);
        });
    });

    it('accepts saturated colours', () => {
        expect(isColourful('#cc3595')).toBe(true);
        expect(isColourful('#2c6234')).toBe(true);
    });
});

describe('extractDecorationLines', () => {
    it('collects thin coloured filled slivers and skips clips, rules and glyph-sized shapes', () => {
        const fnArray = [
            OPS.setFillRGBColor,
            OPS.constructPath, // thin coloured sliver: kept
            OPS.constructPath, // clip: ignored
            OPS.constructPath, // too thick: ignored
            OPS.setFillRGBColor,
            OPS.constructPath, // black table rule: ignored
        ];
        const argsArray = [
            '#cc3595',
            [OPS.fill, [rect(10, 100, 50, 0.7)]],
            [OPS.endPath, [rect(0, 0, 500, 800)]],
            [OPS.fill, [rect(10, 100, 50, 8)]],
            '#000000',
            [OPS.fill, [rect(10, 100, 50, 0.7)]],
        ];

        const lines = extractDecorationLines(fnArray, argsArray, OPS);

        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatchObject({ x0: 10, x1: 60, color: '#cc3595' });
        expect(lines[0]!.y).toBeCloseTo(100.35);
    });

    it('applies the current transformation matrix', () => {
        const fnArray = [OPS.setFillRGBColor, OPS.save, OPS.transform, OPS.constructPath, OPS.restore];
        const argsArray = ['#cc3595', undefined, [1, 0, 0, 1, 100, 200], [OPS.fill, [rect(0, 0, 40, 0.5)]], undefined];

        const [line] = extractDecorationLines(fnArray, argsArray, OPS);

        expect(line).toMatchObject({ x0: 100, x1: 140 });
    });
});

describe('markItem', () => {
    const word = { str: 'August', x: 100, y: 700, width: 60, height: 12 };
    const line = (y: number, x0 = 100, x1 = 160): DecorationLine => ({ x0, x1, y, color: '#cc3595' });

    it('marks text a line runs through as deleted', () => {
        expect(markItem(word, [line(704)])).toBe('[-August-]');
    });

    it('marks underlined text as inserted', () => {
        expect(markItem(word, [line(698.5)])).toBe('[+August+]');
    });

    it('leaves text alone when no line is near it or the line is elsewhere on the page', () => {
        expect(markItem(word, [line(704, 300, 360)])).toBe('August');
        expect(markItem(word, [line(740)])).toBe('August');
        expect(markItem(word, [])).toBe('August');
    });

    it('marks only the part of a run the line covers', () => {
        const run = { str: 'Hans Frey, Schweiz', x: 0, y: 700, width: 180, height: 12 };
        expect(markItem(run, [line(698.5, 100, 180)])).toBe('Hans Frey,[+ Schweiz+]');
    });

    it('marks a deletion and the insertion that replaces it when pdf.js joins them into one run', () => {
        // "The seat is Geneva Lisbon under": 10 points per character, "Geneva" struck, "Lisbon" underlined.
        const run = { str: 'The seat is Geneva Lisbon under', x: 0, y: 700, width: 310, height: 12 };
        const struck = line(704, 120, 180);
        const underlined = line(698.5, 190, 250);
        expect(markItem(run, [struck, underlined])).toBe('The seat is [-Geneva-] [+Lisbon+] under');
        expect(markItem(run, [underlined, struck])).toBe('The seat is [-Geneva-] [+Lisbon+] under');
    });

    it('marks a second line over the same text only once', () => {
        expect(markItem(word, [line(704), line(704.5)])).toBe('[-August-]');
    });

    it('skips hyperlinks and glyph-only runs', () => {
        expect(markItem({ ...word, str: 'https://example.com/x' }, [line(698.5)])).toBe('https://example.com/x');
        expect(markItem({ ...word, str: '•' }, [line(698.5)])).toBe('•');
        expect(markItem(word, [line(698.5)], [{ x0: 90, y0: 690, x1: 170, y1: 712 }])).toBe('August');
    });
});

describe('buildChangeDigest', () => {
    const header = 'Verkaufsprospekt | [-August-] [+Dezember+] 2025';

    it('lists each changed line once with its pages, collapsing a running header', () => {
        const pages = Array.from({ length: 50 }, (_, i) =>
            i === 6 ? `${header}\nHans Frey[-, Schweiz-]\nplain line` : `${header}\nplain line`
        );

        const digest = buildChangeDigest(pages);

        expect(digest).toContain('2 distinct lines');
        expect(digest).toContain(`- p. 1, 2, 3, 4 and 46 more pages: ${header}`);
        expect(digest).toContain('- p. 7: Hans Frey[-, Schweiz-]');
        expect(digest).not.toContain('plain line');
    });

    it('is empty without changes, and can be found again inside the extracted text', () => {
        expect(buildChangeDigest(['nothing here', 'or here'])).toBe('');

        const digest = buildChangeDigest(['a [-b-] c']);
        expect(extractChangeDigest(`legend\n${digest}\nbody text`)).toBe(digest);
        expect(extractChangeDigest('no digest')).toBeUndefined();
    });
});

describe('mergeAdjacentMarkers', () => {
    it('joins neighbouring markers of the same kind', () => {
        expect(mergeAdjacentMarkers('[-Die-] [-erhaltenen-]')).toBe('[-Die erhaltenen-]');
        expect(mergeAdjacentMarkers('[+a+][+b+]')).toBe('[+ab+]');
    });

    it('keeps deletions and insertions apart', () => {
        expect(mergeAdjacentMarkers('[-August-] [+Dezember+]')).toBe('[-August-] [+Dezember+]');
    });
});

describe('page markers', () => {
    it('counts the pages of a PDF from its markers, and nothing for other text', () => {
        const text = [1, 2, 3].map((page) => `${formatPageMarker(page)}\ntext of ${page}`).join('\n\n');

        expect(countPdfPages(text)).toBe(3);
        expect(countPdfPages('plain text with [Page 7] in a sentence')).toBeUndefined();
        expect(countPdfPages('')).toBeUndefined();
        expect(countPdfPages('# Notes\n\n[Page 1]\n\nsome text\n\n[Page 9]\n')).toBeUndefined();
    });
});
