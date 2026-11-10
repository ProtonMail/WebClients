type Matrix = [number, number, number, number, number, number];

/** The operator codes the estimate needs, passed in so this stays free of the PDF library. */
export type PdfOperatorCodes = {
    save: number;
    restore: number;
    transform: number;
    formBegin: number;
    formEnd: number;
    images: ReadonlySet<number>;
};

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** `m1` applied after `m2`, as in pdf.js `Util.transform`. */
const multiply = (m1: Matrix, m2: Matrix): Matrix => [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
];

const isMatrix = (value: unknown): value is Matrix =>
    Array.isArray(value) && value.length === 6 && value.every((n) => typeof n === 'number');

/**
 * Share of the page (0 to 1) covered by images, from the page's drawing operators. An image is painted
 * into the unit square under the current transform, so its area is the determinant of that transform.
 * Overlaps are not subtracted, so the result is capped at 1. Used to tell a page worth rendering (a
 * figure, a photo, a scan) from one that only has a small logo or an icon.
 */
export function estimateImageCoverage(
    fnArray: ArrayLike<number>,
    argsArray: ArrayLike<unknown>,
    codes: PdfOperatorCodes,
    pageArea: number
): number {
    if (!(pageArea > 0)) {
        return 0;
    }
    const stack: Matrix[] = [];
    let ctm = IDENTITY;
    let covered = 0;

    for (let i = 0; i < fnArray.length; i++) {
        const op = fnArray[i];
        const args = argsArray[i];
        if (op === codes.save) {
            stack.push(ctm);
        } else if (op === codes.restore) {
            ctm = stack.pop() ?? IDENTITY;
        } else if (op === codes.transform && isMatrix(args)) {
            ctm = multiply(ctm, args);
        } else if (op === codes.formBegin) {
            stack.push(ctm);
            const matrix = Array.isArray(args) ? args[0] : undefined;
            if (isMatrix(matrix)) {
                ctm = multiply(ctm, matrix);
            }
        } else if (op === codes.formEnd) {
            ctm = stack.pop() ?? IDENTITY;
        } else if (codes.images.has(op)) {
            covered += Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2]);
        }
    }
    return Math.min(1, covered / pageArea);
}
