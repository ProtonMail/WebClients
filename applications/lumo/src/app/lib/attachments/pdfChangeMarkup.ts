/**
 * Recovers "tracked changes" drawn into a PDF.
 *
 * Review copies of a document (Word compare, Acrobat redlines...) are flattened to a PDF where a
 * deletion is text with a coloured line through it and an insertion is coloured text with a line
 * under it. Plain text extraction loses both, so the document looks like it has no changes. Here
 * the coloured thin lines are matched to the text they cross, and that text is wrapped:
 *
 *   [-deleted text-]    struck through
 *   [+inserted text+]   underlined
 *
 * Only colourful lines count: black and grey thin lines are table rules and borders. Underlines on
 * hyperlinks are skipped because they are not changes.
 */

export type DecorationLine = {
    x0: number;
    x1: number;
    y: number;
    color: string;
};

export type LinkRect = { x0: number; y0: number; x1: number; y1: number };

export type PositionedText = {
    str: string;
    x: number;
    /** Baseline, in the same coordinate space as the lines. */
    y: number;
    width: number;
    /** Approximate font size. */
    height: number;
};

/** The subset of pdf.js operator codes used here (`PDFJS.OPS`). */
export type PdfOps = {
    save: number;
    restore: number;
    transform: number;
    setFillRGBColor: number;
    setStrokeRGBColor: number;
    constructPath: number;
    endPath: number;
    stroke: number;
    closeStroke: number;
    fill: number;
    eoFill: number;
    fillStroke: number;
    eoFillStroke: number;
    closeFillStroke: number;
    closeEOFillStroke: number;
};

const MAX_LINE_THICKNESS = 1.6;
const MIN_LINE_LENGTH = 4;
/** pdf.js path encoding: 0 moveTo(x,y), 1 lineTo(x,y), 2 curveTo(3 points), 3 quadraticCurveTo(2 points), 4 closePath. */
const MOVE_TO = 0;
const LINE_TO = 1;
const CLOSE_PATH = 4;

export const CHANGE_MARKUP_LEGEND =
    '[Markup in this document, recovered from how it is drawn: [-text-] is struck through (deleted), [+text+] is underlined (inserted).]';

function parseHexColor(color: string): [number, number, number] | undefined {
    const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
    return match ? [parseInt(match[1]!, 16), parseInt(match[2]!, 16), parseInt(match[3]!, 16)] : undefined;
}

/** The colours word processors give hyperlinks: their underline is a link style, not a change. */
const HYPERLINK_COLOURS = new Set(['#0563c1', '#0000ff', '#0000ee']);
const LOOKS_LIKE_URL = /https?:\/\/|www\.|\.(com|org|net|ch|lu|eu|de)(\/|$)/i;
const HAS_WORD_CHARACTER = /[\p{L}\p{N}]/u;

/** Black, white and greys are structure (rules, borders); change markup is drawn in a colour. */
export function isColourful(color: string): boolean {
    const rgb = parseHexColor(color);
    if (!rgb || HYPERLINK_COLOURS.has(color.toLowerCase())) {
        return false;
    }
    const max = Math.max(...rgb);
    const min = Math.min(...rgb);
    return max > 0 && (max - min) / max > 0.25;
}

/** Collects thin horizontal coloured lines (filled slivers or stroked segments) from a pdf.js operator list. */
export function extractDecorationLines(fnArray: number[], argsArray: any[], ops: PdfOps): DecorationLine[] {
    const fillOps = new Set([ops.fill, ops.eoFill, ops.fillStroke, ops.eoFillStroke, ops.closeFillStroke, ops.closeEOFillStroke]);
    const strokeOps = new Set([ops.stroke, ops.closeStroke, ops.fillStroke, ops.eoFillStroke, ops.closeFillStroke, ops.closeEOFillStroke]);

    const lines: DecorationLine[] = [];
    const stack: number[][] = [];
    let ctm = [1, 0, 0, 1, 0, 0];
    let fill = '#000000';
    let stroke = '#000000';

    for (let i = 0; i < fnArray.length; i++) {
        const op = fnArray[i]!;
        const args = argsArray[i];

        if (op === ops.save) {
            stack.push(ctm.slice());
        } else if (op === ops.restore) {
            ctm = stack.pop() ?? ctm;
        } else if (op === ops.transform) {
            const [a, b, c, d, e, f] = args as number[];
            ctm = [
                ctm[0]! * a! + ctm[2]! * b!,
                ctm[1]! * a! + ctm[3]! * b!,
                ctm[0]! * c! + ctm[2]! * d!,
                ctm[1]! * c! + ctm[3]! * d!,
                ctm[0]! * e! + ctm[2]! * f! + ctm[4]!,
                ctm[1]! * e! + ctm[3]! * f! + ctm[5]!,
            ];
        } else if (op === ops.setFillRGBColor) {
            fill = String(args);
        } else if (op === ops.setStrokeRGBColor) {
            stroke = String(args);
        } else if (op === ops.constructPath) {
            const paint: number = args[0];
            if (paint === ops.endPath) {
                continue; // a clip or a no-op path, nothing is drawn
            }
            const data: ArrayLike<number> | undefined = args[1]?.[0];
            if (!data) {
                continue;
            }
            const xs: number[] = [];
            const ys: number[] = [];
            let simple = true;
            for (let k = 0; k < data.length; ) {
                const cmd = data[k]!;
                if (cmd === MOVE_TO || cmd === LINE_TO) {
                    const x = data[k + 1]!;
                    const y = data[k + 2]!;
                    xs.push(ctm[0]! * x + ctm[2]! * y + ctm[4]!);
                    ys.push(ctm[1]! * x + ctm[3]! * y + ctm[5]!);
                    k += 3;
                } else if (cmd === CLOSE_PATH) {
                    k += 1;
                } else {
                    simple = false; // curves are glyphs and logos, not lines
                    break;
                }
            }
            if (!simple || xs.length === 0 || xs.length > 6) {
                continue;
            }
            const x0 = Math.min(...xs);
            const x1 = Math.max(...xs);
            const thickness = Math.max(...ys) - Math.min(...ys);
            if (x1 - x0 < MIN_LINE_LENGTH || thickness > MAX_LINE_THICKNESS) {
                continue;
            }
            // A closed sliver is filled; an open segment is stroked. Prefer the colour that paints.
            const color = fillOps.has(paint) ? fill : strokeOps.has(paint) ? stroke : undefined;
            if (color && isColourful(color)) {
                lines.push({ x0, x1, y: (Math.max(...ys) + Math.min(...ys)) / 2, color });
            }
        }
    }
    return lines;
}

type Kind = 'delete' | 'insert';

function classify(line: DecorationLine, item: PositionedText): Kind | undefined {
    const size = item.height || 10;
    const offset = line.y - item.y; // above the baseline is positive
    if (offset > 0.15 * size && offset < 0.7 * size) {
        return 'delete';
    }
    if (offset > -0.4 * size && offset <= 0.15 * size) {
        return 'insert';
    }
    return undefined;
}

function overlapsLink(line: DecorationLine, links: LinkRect[]): boolean {
    return links.some(
        (link) => line.x0 >= link.x0 - 2 && line.x1 <= link.x1 + 2 && line.y >= link.y0 - 4 && line.y <= link.y1 + 2
    );
}

/** Wraps the part of `item` that a deletion or insertion line crosses; unmarked text is returned unchanged. */
export function markItem(item: PositionedText, lines: DecorationLine[], links: LinkRect[] = []): string {
    if (!item.str.trim() || item.width <= 0 || LOOKS_LIKE_URL.test(item.str)) {
        return item.str;
    }
    // pdf.js joins neighbouring words into one item, so a deletion and the insertion that replaces it often
    // share an item: every line crossing it counts, not only the first.
    const found: { kind: Kind; from: number; to: number }[] = [];
    for (const line of lines) {
        const kind = classify(line, item);
        if (!kind || overlapsLink(line, links)) {
            continue;
        }
        const overlap = Math.min(line.x1, item.x + item.width) - Math.max(line.x0, item.x);
        if (overlap < 1.5) {
            continue; // a line that only grazes the item belongs to its neighbour
        }
        const from = Math.max(0, Math.round(((line.x0 - item.x) / item.width) * item.str.length));
        const to = Math.min(item.str.length, Math.round(((line.x1 - item.x) / item.width) * item.str.length));
        if (to <= from) {
            continue;
        }
        found.push({ kind, from, to });
    }

    const marks: { kind: Kind; from: number; to: number }[] = [];
    for (const mark of found.sort((a, b) => a.from - b.from)) {
        // Keep whole items whole when the line covers nearly all of them (avoids rounding artefacts at the edges).
        const covers = mark.to - mark.from >= item.str.length - 1;
        const from = covers ? 0 : mark.from;
        const to = covers ? item.str.length : mark.to;
        if (!HAS_WORD_CHARACTER.test(item.str.slice(from, to))) {
            continue; // bullets, icons and zero-width characters are not worth a marker
        }
        if (from < (marks[marks.length - 1]?.to ?? 0)) {
            continue; // a second line over the same text (a double line, a drawn border) adds nothing
        }
        marks.push({ kind: mark.kind, from, to });
    }

    let result = '';
    let cursor = 0;
    for (const { kind, from, to } of marks) {
        const [open, close] = kind === 'delete' ? ['[-', '-]'] : ['[+', '+]'];
        result += `${item.str.slice(cursor, from)}${open}${item.str.slice(from, to)}${close}`;
        cursor = to;
    }
    return `${result}${item.str.slice(cursor)}`;
}

const MARKER = /\[-[^\]\n]+-\]|\[\+[^\]\n]+\+\]/;
const CHANGE_DIGEST_START = '[Tracked changes in this document';
const CHANGE_DIGEST_END = '[End of tracked changes]';
const MAX_DIGEST_LINE_CHARS = 280;
const MAX_DIGEST_CHARS = 40_000;
const MAX_PAGES_LISTED = 4;

/**
 * Every line that carries a change marker, once, with the PDF pages it appears on. A review copy
 * can have hundreds of pages but only a few dozen changes, so this lets a reader see all of them
 * at once instead of paging through the document. Lines that repeat on many pages (a running
 * header) are listed once with a count.
 */
export function buildChangeDigest(pageTexts: string[]): string {
    const entries = new Map<string, number[]>();
    pageTexts.forEach((text, index) => {
        for (const raw of text.split('\n')) {
            if (!MARKER.test(raw)) {
                continue;
            }
            const line = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_DIGEST_LINE_CHARS);
            const pages = entries.get(line) ?? [];
            if (pages[pages.length - 1] !== index + 1) {
                pages.push(index + 1);
            }
            entries.set(line, pages);
        }
    });
    if (entries.size === 0) {
        return '';
    }

    const lines: string[] = [];
    let size = 0;
    let omitted = 0;
    for (const [line, pages] of entries) {
        const listed = pages.slice(0, MAX_PAGES_LISTED).join(', ');
        const more = pages.length > MAX_PAGES_LISTED ? ` and ${pages.length - MAX_PAGES_LISTED} more pages` : '';
        const entry = `- p. ${listed}${more}: ${line}`;
        if (size + entry.length > MAX_DIGEST_CHARS) {
            omitted += 1;
            continue;
        }
        size += entry.length;
        lines.push(entry);
    }
    return [
        `${CHANGE_DIGEST_START}: ${entries.size} distinct lines with changes, by PDF page. The full text carries the same markers.]`,
        ...lines,
        ...(omitted > 0 ? [`- … and ${omitted} more lines, found in the full text`] : []),
        CHANGE_DIGEST_END,
    ].join('\n');
}

/** The digest at the top of an extracted PDF's text, if it has one. */
export function extractChangeDigest(markdown: string): string | undefined {
    const start = markdown.indexOf(CHANGE_DIGEST_START);
    if (start === -1) {
        return undefined;
    }
    const end = markdown.indexOf(CHANGE_DIGEST_END, start);
    return end === -1 ? undefined : markdown.slice(start, end + CHANGE_DIGEST_END.length);
}

/** Joins adjacent markers of the same kind: "[-a-][-b-]" becomes "[-ab-]". */
export function mergeAdjacentMarkers(text: string): string {
    return text.replace(/-\]( ?)\[-/g, '$1').replace(/\+\]( ?)\[\+/g, '$1');
}

/** Line that starts each page of a PDF's extracted text. */
export const formatPageMarker = (page: number) => `[Page ${page}]`;

const PAGE_MARKER = /^\[Page (\d+)\]$/gm;

/**
 * Pages of a PDF, from the markers in its extracted text; undefined for text that has none. Only
 * markers that run 1, 2, 3... in order count, as in a PDF's text, so a lone "[Page n]" line in a
 * markdown file does not make it a PDF.
 */
export function countPdfPages(markdown: string): number | undefined {
    let next = 1;
    for (const match of markdown.matchAll(PAGE_MARKER)) {
        if (Number(match[1]) === next) {
            next += 1;
        }
    }
    return next > 2 ? next - 1 : undefined;
}
