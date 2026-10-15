import { ARIAL_BOLD_ADVANCES, ARIAL_REGULAR_ADVANCES, ARIAL_UNITS_PER_EM } from './arialMetrics.generated';
import { WIDTH_SAFETY } from './slideTokens';

/**
 * Text measurement for slide layout, from Arial's advance widths (no DOM, so it runs the same in the
 * browser and in tests). Characters outside the table (CJK, emoji, rare scripts) count as one em:
 * Arial doesn't have them, the app showing the file substitutes a font, and a full em is the
 * conservative guess. Kerning is ignored because pptxgenjs doesn't turn it on.
 */

const UNKNOWN_CHARACTER_EM = 1;

const characterEm = (codePoint: number, bold: boolean): number => {
    const advance = (bold ? ARIAL_BOLD_ADVANCES : ARIAL_REGULAR_ADVANCES)[codePoint];
    return advance === undefined ? UNKNOWN_CHARACTER_EM : advance / ARIAL_UNITS_PER_EM;
};

/**
 * Width of `text` in points. Layout fitting keeps the safety headroom; the preview passes 1 so it
 * breaks lines where a renderer using the real font would.
 */
export const measureTextPt = (text: string, fontSizePt: number, bold: boolean, safety = WIDTH_SAFETY): number => {
    let em = 0;
    for (const character of text) {
        em += characterEm(character.codePointAt(0)!, bold);
    }
    return em * fontSizePt * safety;
};

/** Splits a word that is wider than a line on its own, the way PowerPoint breaks it: by character. */
const breakLongWord = (
    word: string,
    maxWidthPt: number,
    fontSizePt: number,
    bold: boolean,
    safety: number
): string[] => {
    const pieces: string[] = [];
    let current = '';
    for (const character of word) {
        if (current && measureTextPt(current + character, fontSizePt, bold, safety) > maxWidthPt) {
            pieces.push(current);
            current = character;
        } else {
            current += character;
        }
    }
    if (current) {
        pieces.push(current);
    }
    return pieces;
};

/**
 * Greedy line breaking at spaces. PowerPoint can also break after a hyphen; not modelling that only
 * ever overestimates the line count, which is the safe direction.
 */
export const wrapText = (
    text: string,
    maxWidthPt: number,
    fontSizePt: number,
    bold: boolean,
    safety = WIDTH_SAFETY
): string[] => {
    const lines: string[] = [];
    let current = '';
    for (const word of text.split(' ').filter(Boolean)) {
        const candidate = current ? `${current} ${word}` : word;
        if (measureTextPt(candidate, fontSizePt, bold, safety) <= maxWidthPt) {
            current = candidate;
            continue;
        }
        if (current) {
            lines.push(current);
        }
        if (measureTextPt(word, fontSizePt, bold, safety) <= maxWidthPt) {
            current = word;
            continue;
        }
        const pieces = breakLongWord(word, maxWidthPt, fontSizePt, bold, safety);
        lines.push(...pieces.slice(0, -1));
        current = pieces[pieces.length - 1] ?? '';
    }
    if (current || lines.length === 0) {
        lines.push(current);
    }
    return lines;
};
