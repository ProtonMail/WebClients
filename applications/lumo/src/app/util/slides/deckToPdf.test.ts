import type { jsPDF as JsPdf } from 'jspdf';

import { parseDeck } from './deck';
import { canWriteDeckPdfAsText, isWinAnsiText, writeDeckPdf } from './deckToPdf';
import { SLIDES_EVAL_FIXTURES } from './eval/slidesEvalFixtures';
import { layoutDeck } from './layoutDeck';

// The browser build is ESM, which Jest doesn't transform; the Node build is the same library.
const { jsPDF } = require('jspdf/dist/jspdf.node.min.js') as { jsPDF: typeof JsPdf };

const laidOutFixture = (id: string) => {
    const fixture = SLIDES_EVAL_FIXTURES.find((candidate) => {
        return candidate.id === id;
    })!;
    return layoutDeck(parseDeck(fixture.modelOutput).deck!);
};

const writeUncompressed = (id: string): string => {
    const bytes = writeDeckPdf(laidOutFixture(id), jsPDF, { compress: false });
    return Buffer.from(bytes).toString('latin1');
};

/** The strings drawn with `Tj`, unescaped. */
const drawnStrings = (pdf: string): string[] => {
    return [...pdf.matchAll(/\(((?:\\.|[^\\)])*)\) Tj/g)].map((match) => {
        return match[1]!.replace(/\\([()\\])/g, '$1');
    });
};

describe('deckToPdf', () => {
    it('writes one 720 × 405 pt page per laid-out slide', () => {
        const laidOut = laidOutFixture('all-layouts');
        const pdf = writeUncompressed('all-layouts');
        expect(pdf.startsWith('%PDF')).toBe(true);
        expect((pdf.match(/\/Type \/Page\b(?!s)/g) ?? []).length).toBe(laidOut.slides.length);
        const boxes = [...pdf.matchAll(/\/MediaBox \[([^\]]+)\]/g)].map((match) => {
            return match[1]!.trim().split(/\s+/).map(Number);
        });
        expect(boxes).toHaveLength(laidOut.slides.length);
        boxes.forEach((box) => {
            expect(box).toEqual([0, 0, 720, 405]);
        });
    });

    it('writes split slides as separate pages', () => {
        const laidOut = laidOutFixture('split-list');
        expect(laidOut.slides.length).toBeGreaterThan(1);
        const pdf = writeUncompressed('split-list');
        expect((pdf.match(/\/Type \/Page\b(?!s)/g) ?? []).length).toBe(laidOut.slides.length);
    });

    it('draws slide text as text, line by line', () => {
        const laidOut = laidOutFixture('all-layouts');
        const strings = drawnStrings(writeUncompressed('all-layouts'));
        const titles = laidOut.slides.flatMap((slide) => {
            return slide.shapes.flatMap((shape) => {
                return shape.kind === 'text' && shape.role === 'title' ? [shape.paragraphs[0]!.text] : [];
            });
        });
        expect(titles.length).toBeGreaterThan(0);
        const joined = strings.join(' ');
        titles.forEach((title) => {
            expect(joined).toContain(title.split(' ')[0]);
        });
        // The bullet glyph is WinAnsi 0x95.
        expect(strings).toContain('\u0095');
    });

    it('draws chart labels and bars as vector shapes, not images', () => {
        const pdf = writeUncompressed('northwind-q3');
        expect(pdf).not.toContain('/Subtype /Image');
        // Bars are filled rectangles.
        expect(pdf).toMatch(/re\nf/);
        const fixture = laidOutFixture('northwind-q3');
        const chart = fixture.slides
            .flatMap((slide) => {
                return slide.shapes;
            })
            .find((shape) => {
                return shape.kind === 'chart';
            });
        expect(chart).toBeDefined();
        if (chart?.kind === 'chart') {
            expect(drawnStrings(pdf)).toContain(chart.chart.categories[0]);
        }
    });

    it('draws pie slices as curves', () => {
        const pdf = writeUncompressed('pie-shares');
        expect(pdf).toMatch(/ c\n/);
        expect(pdf).not.toContain('/Subtype /Image');
    });

    it('draws the "Data needed" box with a dashed border', () => {
        const pdf = writeUncompressed('missing-data');
        expect(pdf).toMatch(/\[[\d.]+ [\d.]+\] 0\.? d/);
        expect(drawnStrings(pdf).join(' ')).toContain('Data needed');
    });

    it('encodes Western European punctuation as WinAnsi', () => {
        expect(isWinAnsiText('Revenue (€M) – “Q3” • Müller…')).toBe(true);
        const laidOut = laidOutFixture('all-layouts');
        laidOut.slides[0]!.shapes[0] = {
            ...laidOut.slides[0]!.shapes[0]!,
            kind: 'text',
            paragraphs: [{ text: 'Café – €5', level: 0 }],
        } as (typeof laidOut.slides)[0]['shapes'][0];
        const pdf = Buffer.from(writeDeckPdf(laidOut, jsPDF, { compress: false })).toString('latin1');
        // é = 0xE9, – = 0x96, € = 0x80 in WinAnsi.
        expect(pdf).toContain('(Café \u0096 \u00805) Tj');
    });

    it('asks for the image fallback when text is outside WinAnsi', () => {
        expect(isWinAnsiText('新製品')).toBe(false);
        expect(isWinAnsiText('Привет')).toBe(false);
        expect(isWinAnsiText('Zdeněk')).toBe(false);
        expect(canWriteDeckPdfAsText(laidOutFixture('cjk-text'))).toBe(false);
        expect(canWriteDeckPdfAsText(laidOutFixture('all-layouts'))).toBe(true);
        expect(canWriteDeckPdfAsText(laidOutFixture('german-compounds'))).toBe(true);
        expect(() => {
            return writeDeckPdf(laidOutFixture('cjk-text'), jsPDF);
        }).toThrow();
    });
});
