/*
 * Copyright notice:
 *
 * This file was adapted from https://gitlab.com/autokent/pdf-parse, MIT license
 */
// Use the "legacy" build: it transpiles modern syntax (e.g. `static {}` class
// initialization blocks) that older browsers can't parse. The default build
// ships untranspiled and webpack/babel don't transpile node_modules, so it
// throws "Unexpected token '{'" on those browsers.
import * as PDFJS from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';

import type { DecorationLine, LinkRect, PdfOps } from './pdfChangeMarkup';
import {
    CHANGE_MARKUP_LEGEND,
    buildChangeDigest,
    extractDecorationLines,
    formatPageMarker,
    markItem,
    mergeAdjacentMarkers,
} from './pdfChangeMarkup';
import { estimateImageCoverage } from './pdfImageCoverage';
import { MAX_PDF_PAGE_IMAGES_PER_REQUEST } from './pdfPageLimits';

const workerSrc = new URL(
    '../../../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
    import.meta.url
).toString();
PDFJS.GlobalWorkerOptions.workerSrc = workerSrc;

// Define the interface for render options
interface RenderOptions {
    normalizeWhitespace: boolean;
    disableCombineTextItems: boolean;
}

/** Longest side, in pixels, of a rendered page: large enough to read, small enough to keep token cost bounded. */
const PDF_PAGE_IMAGE_MAX_EDGE = 1280;
/** Pages with fewer extracted characters than this are likely scans or figures and get rendered. */
const MIN_TEXT_CHARS_WITHOUT_IMAGE = 200;
/** Share of the page images must cover for a page that has text to be rendered as well. */
const MIN_IMAGE_COVERAGE = 0.15;
/** In pages-only mode, how many pages are read at most looking for ones worth rendering. */
const PAGES_ONLY_MAX_PAGES_SCANNED = 40;
const JPEG_QUALITY = 0.8;
/** Pages that had coloured lines drawn through or under their text, the only ones whose text can carry change markers. */
const HAS_MARKUP = /\[-[^\]\n]+-\]|\[\+[^\]\n]+\+\]/;
const pagesWithChangeLines = new WeakSet<object>();

type PdfRenderedPage = {
    page: number;
    data: Uint8Array<ArrayBuffer>;
};

// Define the interface for PDF options
interface PDFOptions {
    pagerender: (pageData: any) => Promise<string>;
    max: number;
    /** Also render the pages that contain images (or hardly any text) so a vision model can see them. */
    renderPageImages: boolean;
    maxPageImages: number;
    /** Only collect the page images: skip the text and stop once `maxPageImages` pages are rendered. */
    pagesOnly: boolean;
}

// Define the interface for the PDF return object
interface PDFReturn {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    pageImages: PdfRenderedPage[];
}

// Define the default options
const DEFAULT_OPTIONS: PDFOptions = {
    pagerender: renderPage,
    max: 0,
    renderPageImages: false,
    pagesOnly: false,
    maxPageImages: MAX_PDF_PAGE_IMAGES_PER_REQUEST,
};

// pdfjs's default canvas factory needs `document`, which does not exist in a web worker.
// OffscreenCanvas works both in workers and on the main thread.
class OffscreenCanvasFactory {
    create(width: number, height: number) {
        if (width <= 0 || height <= 0) {
            throw new Error('Invalid canvas size');
        }
        const canvas = new OffscreenCanvas(width, height);
        return { canvas, context: canvas.getContext('2d', { willReadFrequently: false }) };
    }

    reset(canvasAndContext: { canvas: OffscreenCanvas }, width: number, height: number) {
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    }

    destroy(canvasAndContext: { canvas: OffscreenCanvas | null; context: unknown }) {
        if (canvasAndContext.canvas) {
            canvasAndContext.canvas.width = 0;
            canvasAndContext.canvas.height = 0;
        }
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
    }
}

const IMAGE_OPS = new Set<number>([
    PDFJS.OPS.paintImageXObject,
    PDFJS.OPS.paintInlineImageXObject,
    PDFJS.OPS.paintImageXObjectRepeat,
    PDFJS.OPS.paintImageMaskXObject,
    PDFJS.OPS.paintImageMaskXObjectGroup,
    PDFJS.OPS.paintImageMaskXObjectRepeat,
    PDFJS.OPS.paintSolidColorImageMask,
]);

const OPERATOR_CODES = {
    save: PDFJS.OPS.save,
    restore: PDFJS.OPS.restore,
    transform: PDFJS.OPS.transform,
    formBegin: PDFJS.OPS.paintFormXObjectBegin,
    formEnd: PDFJS.OPS.paintFormXObjectEnd,
    images: IMAGE_OPS,
};

/** Whether images cover enough of the page to be worth sending: a logo or an icon is not. */
async function pageHasSignificantImages(page: any): Promise<boolean> {
    const operatorList = await page.getOperatorList();
    const { width, height } = page.getViewport({ scale: 1 });
    return (
        estimateImageCoverage(operatorList.fnArray, operatorList.argsArray, OPERATOR_CODES, width * height) >=
        MIN_IMAGE_COVERAGE
    );
}

/** Renders one page to a JPEG whose longest side is at most {@link PDF_PAGE_IMAGE_MAX_EDGE}. */
async function renderPageToJpeg(page: any): Promise<Uint8Array<ArrayBuffer>> {
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2, PDF_PAGE_IMAGE_MAX_EDGE / Math.max(base.width, base.height));
    const viewport = page.getViewport({ scale });
    const width = Math.max(1, Math.ceil(viewport.width));
    const height = Math.max(1, Math.ceil(viewport.height));

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Could not create a canvas context');
    }
    // JPEG has no alpha: paint a white page background first.
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);

    await page.render({ canvasContext: context, canvas, viewport }).promise;
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
    page.cleanup();
    return new Uint8Array(await blob.arrayBuffer());
}

async function getChangeMarkupGeometry(pageData: any): Promise<{ lines: DecorationLine[]; links: LinkRect[] }> {
    try {
        const operatorList = await pageData.getOperatorList();
        const lines = extractDecorationLines(operatorList.fnArray, operatorList.argsArray, PDFJS.OPS as PdfOps);
        if (lines.length === 0) {
            return { lines, links: [] };
        }
        const annotations: any[] = await pageData.getAnnotations();
        const links = annotations
            .filter((annotation) => annotation.subtype === 'Link' && Array.isArray(annotation.rect))
            .map(({ rect }) => ({ x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3] }));
        return { lines, links };
    } catch (error) {
        // Markup is a bonus: never lose the text of a page because of it.
        console.warn('PDF change markup could not be read', error);
        return { lines: [], links: [] };
    }
}

// Function to render a page
async function renderPage(pageData: any): Promise<string> {
    // Define render options
    const renderOptions: RenderOptions = {
        normalizeWhitespace: true,
        disableCombineTextItems: false,
    };

    // Tracked changes are drawn as coloured lines through or under the text, which text extraction drops.
    // Without such lines this changes nothing; with them each text run is extracted on its own so a line
    // can be matched to exactly the words it crosses.
    const { lines, links } = await getChangeMarkupGeometry(pageData);
    renderOptions.disableCombineTextItems = lines.length > 0;
    if (lines.length > 0) {
        pagesWithChangeLines.add(pageData);
    }

    const textContent: TextContent = await pageData.getTextContent(renderOptions);
    let lastY: number | undefined;
    let lastHeight: number | undefined;
    let text = '';
    // const styles = textContent.styles;
    const items = textContent.items;
    for (const item_ of items) {
        if ((item_ as TextItem).str !== undefined) {
            const item = item_ as TextItem;
            const str =
                lines.length > 0 && Math.abs(item.transform[1]) < 0.01
                    ? markItem(
                          {
                              str: item.str,
                              x: item.transform[4],
                              y: item.transform[5],
                              width: item.width,
                              height: item.height || Math.abs(item.transform[3]),
                          },
                          lines,
                          links
                      )
                    : item.str;
            const y = item.transform[5];
            // const fontName = item.fontName;
            // const style = styles[fontName];
            // console.log({ item, style });
            const deltaY = lastY !== undefined ? (lastY as number) - y : 0;
            const lineBreak = lastHeight ? deltaY / lastHeight : 0;
            let lineBreakCount = Math.round(lineBreak);
            if (lineBreakCount < 0) {
                lineBreakCount = 2;
            }
            // console.log(`ΔY = ${deltaY}, line breaks: ${lineBreak} (rounded to ${lineBreakCount})`);
            const newlines = '\n'.repeat(Math.min(lineBreakCount, 2));
            text += newlines + str;
            if (item.height) lastHeight = item.height;
            lastY = y;
        } else {
            // const item = item_ as TextMarkedContent;
        }
    }
    return text;
}

// Main PDF function
async function pdfParse(dataBuffer: any, options?: Partial<PDFOptions>): Promise<PDFReturn> {
    const ret: PDFReturn = {
        numpages: 0,
        numrender: 0,
        info: null,
        metadata: null,
        text: '',
        pageImages: [],
    };

    const options_: PDFOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
    };

    try {
        const doc = await PDFJS.getDocument(
            options_.renderPageImages ? { data: dataBuffer, CanvasFactory: OffscreenCanvasFactory } : dataBuffer
        ).promise;
        ret.numpages = doc.numPages;

        const metaData = await doc.getMetadata().catch(console.warn);

        ret.info = metaData ? metaData.info : null;
        ret.metadata = metaData ? metaData.metadata : null;

        let counter = options_.max <= 0 ? doc.numPages : options_.max;
        counter = counter > doc.numPages ? doc.numPages : counter;
        if (options_.pagesOnly) {
            // Restoring pages must stay cheap on a long document with no figures: do not read it to the end.
            counter = Math.min(counter, PAGES_ONLY_MAX_PAGES_SCANNED);
        }

        ret.text = '';
        const pageTexts: string[] = [];
        let hasChangeMarkup = false;

        for (let i = 1; i <= counter; i++) {
            if (options_.pagesOnly && ret.pageImages.length >= options_.maxPageImages) {
                break;
            }
            let pageText: string | void = undefined;
            try {
                const pageData = await doc.getPage(i);
                pageText = await options_.pagerender(pageData);
                hasChangeMarkup ||= pagesWithChangeLines.has(pageData);
                if (options_.renderPageImages && ret.pageImages.length < options_.maxPageImages) {
                    const hasText = (pageText?.trim().length ?? 0) >= MIN_TEXT_CHARS_WITHOUT_IMAGE;
                    if (!hasText || (await pageHasSignificantImages(pageData))) {
                        try {
                            ret.pageImages.push({ page: i, data: await renderPageToJpeg(pageData) });
                        } catch (renderError) {
                            // A page that cannot be rendered must not lose the text of the document.
                            console.warn(`PDF page ${i} could not be rendered`, renderError);
                        }
                    }
                }
            } catch (pageError) {
                console.error(pageError);
            }
            if (!options_.pagesOnly) {
                const text = typeof pageText === 'string' ? pageText : '';
                pageTexts.push(text);
                // Marks where each PDF page starts, so notes and answers can cite the page the user sees.
                ret.text = `${ret.text}\n\n${counter > 1 ? `${formatPageMarker(i)}\n` : ''}${text}`;
            }
        }

        if (!options_.pagesOnly && hasChangeMarkup && HAS_MARKUP.test(ret.text)) {
            const digest = buildChangeDigest(pageTexts.map(mergeAdjacentMarkers));
            ret.text = [CHANGE_MARKUP_LEGEND, digest, mergeAdjacentMarkers(ret.text)].filter(Boolean).join('\n');
        }

        ret.numrender = counter;
        void doc.destroy();

        return ret;
    } catch (error) {
        throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export default pdfParse;
