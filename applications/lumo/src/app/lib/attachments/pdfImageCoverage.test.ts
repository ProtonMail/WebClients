import { type PdfOperatorCodes, estimateImageCoverage } from './pdfImageCoverage';

const codes: PdfOperatorCodes = { save: 1, restore: 2, transform: 3, formBegin: 4, formEnd: 5, images: new Set([10]) };
const PAGE_AREA = 600 * 800;

const coverage = (ops: [number, unknown?][]) =>
    estimateImageCoverage(
        ops.map(([op]) => op),
        ops.map(([, args]) => args),
        codes,
        PAGE_AREA
    );

describe('estimateImageCoverage', () => {
    it('is zero for a page without images', () => {
        expect(coverage([[1], [3, [1, 0, 0, 1, 0, 0]], [2]])).toBe(0);
    });

    it('measures an image by the area of the transform it is painted under', () => {
        // A 300x400 image: a quarter of the page.
        expect(coverage([[1], [3, [300, 0, 0, 400, 10, 10]], [10], [2]])).toBeCloseTo(0.25);
    });

    it('treats a small logo as negligible', () => {
        expect(coverage([[1], [3, [40, 0, 0, 20, 0, 0]], [10], [2]])).toBeLessThan(0.01);
    });

    it('restores the transform after a restore', () => {
        expect(coverage([[1], [3, [600, 0, 0, 800, 0, 0]], [2], [10]])).toBeLessThan(0.0001);
    });

    it('follows the matrix of a form XObject', () => {
        expect(coverage([[4, [[600, 0, 0, 800, 0, 0], [0, 0, 1, 1]]], [10], [5]])).toBe(1);
    });

    it('is not affected by rotation', () => {
        expect(coverage([[3, [0, 400, -300, 0, 0, 0]], [10]])).toBeCloseTo(0.25);
    });

    it('caps overlapping images at the whole page', () => {
        expect(coverage([[3, [600, 0, 0, 800, 0, 0]], [10], [10]])).toBe(1);
    });
});
