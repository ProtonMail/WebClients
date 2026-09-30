import { yieldToMainThread } from '../export/exportUiHelpers';
import type { MountedExportDocument } from '../export/htmlDocumentCapture';
import {
    DEFAULT_VIEWPORT_WIDTH,
    PRESENTATION_CAPTURE_SCALE,
    SLIDE_FRAME_HEIGHT_CSS,
    SLIDE_FRAME_WIDTH_CSS,
    captureElementToCanvas,
    captureSingleSlideDocument,
    getDocumentCaptureTarget,
    isHTMLElement,
    measureCaptureTargetHeight,
    mountExportDocument,
    prepareMountedExport,
    releaseCanvas,
} from '../export/htmlDocumentCapture';

export type PdfExportProgressCallback = (current: number, total: number) => void;

export interface HtmlDocumentToPdfOptions {
    /** Fixed layout width in CSS pixels before capture. */
    viewportWidth?: number;
    /** Max time to wait for the export document to load. */
    loadTimeoutMs?: number;
    /** html2canvas scale factor. */
    scale?: number;
    /** jsPDF page orientation. */
    orientation?: 'portrait' | 'landscape';
    /** When set, capture each matching element as its own PDF page instead of the whole body. */
    pageSelector?: string;
    /** Inset captured content from each PDF page edge, in points (documents only). */
    pageMarginPt?: number;
    /** Called as each page/slide is processed during export. */
    onProgress?: PdfExportProgressCallback;
}

interface FitDimensions {
    x: number;
    y: number;
    width: number;
    height: number;
}

type Html2CanvasFn = (element: HTMLElement, options: Record<string, unknown>) => Promise<HTMLCanvasElement>;

type JsPdfInstance = {
    internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
    addImage: (imageData: string, format: string, x: number, y: number, width: number, height: number) => void;
    addPage: () => void;
    output: (type: string) => ArrayBuffer;
};

type JsPdfConstructor = new (options: {
    unit: string;
    format: string | [number, number];
    orientation?: 'portrait' | 'landscape';
}) => JsPdfInstance;

const DEFAULT_CAPTURE_SCALE = 2;
/**
 * Documents are captured one PDF page at a time, so each canvas stays around 1600 × 2400 device px
 * at scale 2 — well inside browser canvas-area limits (Safari's is the tightest) for any document length.
 */
const DOCUMENT_CAPTURE_SCALE = 2;
/** Elements whose top edge is an acceptable place to start a new page. */
const PAGE_BREAK_CANDIDATE_SELECTOR =
    'h1, h2, h3, h4, h5, h6, p, li, tr, pre, blockquote, table, hr, img, figure, dt, dd';
const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';
/**
 * A page must be at least this full before we break early at a block boundary; below it we'd
 * rather cut through the oversized block than leave a mostly-empty page.
 */
const MIN_PAGE_FILL_RATIO = 0.3;

function computeFitDimensions(
    canvasWidth: number,
    canvasHeight: number,
    pageWidth: number,
    pageHeight: number
): FitDimensions {
    if (canvasWidth <= 0 || canvasHeight <= 0) {
        throw new Error('PDF export produced an empty canvas.');
    }

    const widthScale = pageWidth / canvasWidth;
    const heightScale = pageHeight / canvasHeight;
    const fitScale = Math.min(widthScale, heightScale);
    const width = canvasWidth * fitScale;
    const height = canvasHeight * fitScale;

    return {
        x: (pageWidth - width) / 2,
        y: (pageHeight - height) / 2,
        width,
        height,
    };
}

function addCanvasPageToPdf(
    doc: JsPdfInstance,
    canvas: HTMLCanvasElement,
    pageWidth: number,
    pageHeight: number,
    addNewPage: boolean
): void {
    if (addNewPage) {
        doc.addPage();
    }

    const imgData = canvas.toDataURL('image/png');
    const fit = computeFitDimensions(canvas.width, canvas.height, pageWidth, pageHeight);
    doc.addImage(imgData, 'PNG', fit.x, fit.y, fit.width, fit.height);
    releaseCanvas(canvas);
}

/**
 * Collect vertical offsets (CSS px, relative to `target`) where a new page may start: the top edge of
 * each block-level element. Offsets that would leave a heading stranded at the bottom of a page —
 * anything between a heading's top and the start of the content that follows it — are excluded.
 */
export function collectDocumentPageBreakCandidates(target: HTMLElement): number[] {
    const originTop = target.getBoundingClientRect().top;

    const keepWithNextRanges = Array.from(target.querySelectorAll(HEADING_SELECTOR)).map((heading) => {
        const rect = heading.getBoundingClientRect();
        const nextTop = heading.nextElementSibling?.getBoundingClientRect().top ?? rect.bottom;
        return { start: rect.top - originTop, end: Math.max(rect.bottom, nextTop) - originTop };
    });

    const candidates: number[] = [];
    target.querySelectorAll(PAGE_BREAK_CANDIDATE_SELECTOR).forEach((element) => {
        const top = element.getBoundingClientRect().top - originTop;
        const strandsHeading = keepWithNextRanges.some((range) => {
            // +1px tolerance: the first child of the following block sits at (or a sub-pixel below) its top.
            return top > range.start && top <= range.end + 1;
        });

        if (!strandsHeading) {
            candidates.push(top);
        }
    });

    return candidates;
}

/**
 * Choose where each PDF page starts (CSS px from the top of the document). Each page ends at the
 * last break candidate that fits, so pages break between blocks rather than through a line of text;
 * a block taller than the remaining space is cut only when no candidate leaves the page at least
 * MIN_PAGE_FILL_RATIO full.
 */
export function computeDocumentPageStarts(candidates: number[], totalHeight: number, pageHeight: number): number[] {
    if (pageHeight <= 0 || totalHeight <= pageHeight) {
        return [0];
    }

    const sortedCandidates = candidates
        .filter((offset) => {
            return offset > 0 && offset < totalHeight;
        })
        .sort((a, b) => {
            return a - b;
        });

    const pageStarts = [0];
    let pageStart = 0;

    while (totalHeight - pageStart > pageHeight) {
        const pageLimit = pageStart + pageHeight;
        const earliestBreak = pageStart + pageHeight * MIN_PAGE_FILL_RATIO;
        let nextStart = pageLimit;

        for (const offset of sortedCandidates) {
            if (offset > pageLimit) {
                break;
            }
            if (offset >= earliestBreak) {
                nextStart = offset;
            }
        }

        pageStarts.push(nextStart);
        pageStart = nextStart;
    }

    return pageStarts;
}

async function captureContinuousPdf(
    mounted: MountedExportDocument,
    viewportWidth: number,
    orientation: 'portrait' | 'landscape',
    pageMarginPt: number,
    html2canvas: Html2CanvasFn,
    JsPDF: JsPdfConstructor,
    onProgress?: PdfExportProgressCallback
): Promise<ArrayBuffer> {
    const captureTarget = getDocumentCaptureTarget(mounted);
    const totalHeight = measureCaptureTargetHeight(captureTarget);

    if (totalHeight <= 0) {
        throw new Error('PDF export produced no content.');
    }

    const doc = new JsPDF({ unit: 'pt', format: 'a4', orientation });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = pageMarginPt;
    const contentWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    const captureWidth = Math.max(captureTarget.scrollWidth, captureTarget.offsetWidth, viewportWidth);
    const pageHeightCss = (printableHeight * captureWidth) / contentWidth;
    const pageStarts = computeDocumentPageStarts(
        collectDocumentPageBreakCandidates(captureTarget),
        totalHeight,
        pageHeightCss
    );

    for (let index = 0; index < pageStarts.length; index++) {
        const sliceStart = pageStarts[index];
        const sliceHeight = (pageStarts[index + 1] ?? totalHeight) - sliceStart;

        onProgress?.(index + 1, pageStarts.length);
        await yieldToMainThread();

        const canvas = await captureElementToCanvas(captureTarget, viewportWidth, DOCUMENT_CAPTURE_SCALE, html2canvas, {
            captureSlice: { y: sliceStart, height: sliceHeight },
        });

        if (canvas.width <= 0 || canvas.height <= 0) {
            throw new Error('PDF export produced an empty canvas.');
        }

        if (index > 0) {
            doc.addPage();
        }

        // Every slice fits the printable area by construction, so it is placed at the top margin
        // and never drawn into the bottom margin or repeated on the next page.
        const imageHeight = (canvas.height * contentWidth) / canvas.width;
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, imageHeight);
        releaseCanvas(canvas);
    }

    return doc.output('arraybuffer');
}

async function capturePagedPdf(
    contentRoot: HTMLElement,
    pageSelector: string,
    viewportWidth: number,
    scale: number,
    orientation: 'portrait' | 'landscape',
    html2canvas: Html2CanvasFn,
    JsPDF: JsPdfConstructor
): Promise<ArrayBuffer> {
    const ownerDocument = contentRoot.ownerDocument;
    const pages = Array.from(contentRoot.querySelectorAll(pageSelector)).filter((node): node is HTMLElement => {
        return isHTMLElement(node, ownerDocument);
    });

    if (pages.length === 0) {
        throw new Error(`No PDF pages matched selector: ${pageSelector}`);
    }

    const doc = new JsPDF({ unit: 'pt', format: 'a4', orientation });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let index = 0; index < pages.length; index++) {
        const canvas = await captureElementToCanvas(pages[index], viewportWidth, scale, html2canvas);
        addCanvasPageToPdf(doc, canvas, pageWidth, pageHeight, index > 0);
    }

    return doc.output('arraybuffer');
}

/**
 * Render multiple standalone slide HTML documents to one PDF, one 16:9 page per document.
 * Each slide is mounted off-screen in the current document and captured separately.
 */
export async function htmlSlideDocumentsToPdfBytes(
    slideDocuments: string[],
    options: Omit<HtmlDocumentToPdfOptions, 'pageSelector'> = {}
): Promise<ArrayBuffer> {
    if (typeof document === 'undefined') {
        throw new Error('HTML document PDF export requires a browser environment.');
    }

    if (slideDocuments.length === 0) {
        throw new Error('Presentation PDF export requires at least one slide.');
    }

    const orientation = options.orientation ?? 'landscape';
    const viewportWidth = options.viewportWidth ?? DEFAULT_VIEWPORT_WIDTH;
    const scale = options.scale ?? PRESENTATION_CAPTURE_SCALE;

    const [{ jsPDF }, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')]);
    const html2canvas = html2canvasModule.default as Html2CanvasFn;
    const JsPDF = jsPDF as unknown as JsPdfConstructor;

    // A 16:9 page (960 × 540pt = 13.33 × 7.5in, PowerPoint's default slide size) so slides fill the
    // page instead of being letterboxed on A4.
    const doc = new JsPDF({ unit: 'pt', format: [SLIDE_FRAME_WIDTH_CSS, SLIDE_FRAME_HEIGHT_CSS], orientation });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let index = 0; index < slideDocuments.length; index++) {
        options.onProgress?.(index + 1, slideDocuments.length);
        await yieldToMainThread();

        const canvas = await captureSingleSlideDocument(slideDocuments[index], viewportWidth, scale, html2canvas);
        addCanvasPageToPdf(doc, canvas, pageWidth, pageHeight, index > 0);
    }

    return doc.output('arraybuffer');
}

/**
 * Render a standalone HTML document to PDF bytes via html2canvas + jsPDF.
 * Requires a browser DOM (not available in Node/jsdom without mocks).
 */
export async function htmlDocumentToPdfBytes(
    htmlDocument: string,
    options: HtmlDocumentToPdfOptions = {}
): Promise<ArrayBuffer> {
    if (typeof document === 'undefined') {
        throw new Error('HTML document PDF export requires a browser environment.');
    }

    const viewportWidth = options.viewportWidth ?? DEFAULT_VIEWPORT_WIDTH;
    const scale = options.scale ?? DEFAULT_CAPTURE_SCALE;
    const orientation = options.orientation ?? 'portrait';
    const pageSelector = options.pageSelector;
    const pageMarginPt = options.pageMarginPt ?? 0;

    const [{ jsPDF }, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')]);
    const html2canvas = html2canvasModule.default as Html2CanvasFn;
    const JsPDF = jsPDF as unknown as JsPdfConstructor;

    const mounted = await mountExportDocument(htmlDocument, viewportWidth);

    try {
        await prepareMountedExport(mounted);

        if (pageSelector) {
            options.onProgress?.(1, 1);
            return await capturePagedPdf(
                mounted.root,
                pageSelector,
                viewportWidth,
                scale,
                orientation,
                html2canvas,
                JsPDF
            );
        }

        return await captureContinuousPdf(
            mounted,
            viewportWidth,
            orientation,
            pageMarginPt,
            html2canvas,
            JsPDF,
            options.onProgress
        );
    } finally {
        mounted.container.remove();
    }
}
