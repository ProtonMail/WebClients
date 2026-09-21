import { yieldToMainThread } from '../export/exportUiHelpers';
import {
    DEFAULT_VIEWPORT_WIDTH,
    PRESENTATION_CAPTURE_SCALE,
    captureElementToCanvas,
    captureSingleSlideDocument,
    getDocumentCaptureTarget,
    isHTMLElement,
    measureCaptureTargetHeight,
    mountExportDocument,
    prepareMountedExport,
} from '../export/htmlDocumentCapture';
import type { MountedExportDocument } from '../export/htmlDocumentCapture';

export { PDF_EXPORT_BODY_CLASS } from '../export/htmlDocumentCapture';

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
    format: string;
    orientation?: 'portrait' | 'landscape';
}) => JsPdfInstance;

const DEFAULT_CAPTURE_SCALE = 2;
/** Use scale 1 for long-form documents to avoid canvas limits and keep text crisp. */
const DOCUMENT_CAPTURE_SCALE = 1;
/** Max CSS pixels captured in one html2canvas call before falling back to vertical slices. */
const MAX_SINGLE_CAPTURE_HEIGHT_CSS = 8000;
/** Vertical slice size for chunked document capture. */
const DOCUMENT_CAPTURE_CHUNK_HEIGHT_CSS = 1200;

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
}

function appendCanvasToContinuousPdf(
    doc: JsPdfInstance,
    canvas: HTMLCanvasElement,
    contentWidth: number,
    printableHeight: number,
    margin: number,
    hasPdfContent: { value: boolean }
): void {
    const imgHeight = (canvas.height * contentWidth) / canvas.width;
    if (imgHeight <= 0) {
        return;
    }

    const imgData = canvas.toDataURL('image/png');
    let heightLeft = imgHeight;
    let position = 0;

    while (heightLeft > 0) {
        if (hasPdfContent.value) {
            doc.addPage();
        }

        doc.addImage(imgData, 'PNG', margin, margin + position, contentWidth, imgHeight);
        hasPdfContent.value = true;
        heightLeft -= printableHeight;
        position = heightLeft - imgHeight;
    }
}

async function captureContinuousPdf(
    mounted: MountedExportDocument,
    viewportWidth: number,
    orientation: 'portrait' | 'landscape',
    pageMarginPt: number,
    html2canvas: Html2CanvasFn,
    JsPDF: JsPdfConstructor
): Promise<ArrayBuffer> {
    const captureTarget = getDocumentCaptureTarget(mounted);
    const totalHeight = measureCaptureTargetHeight(captureTarget);
    const captureScale = DOCUMENT_CAPTURE_SCALE;

    if (totalHeight <= 0) {
        throw new Error('PDF export produced no content.');
    }

    const doc = new JsPDF({ unit: 'pt', format: 'a4', orientation });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = pageMarginPt;
    const contentWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;
    const hasPdfContent = { value: false };

    if (totalHeight <= MAX_SINGLE_CAPTURE_HEIGHT_CSS) {
        const canvas = await captureElementToCanvas(captureTarget, viewportWidth, captureScale, html2canvas, {
            captureFullHeight: true,
            captureHeight: totalHeight,
        });
        appendCanvasToContinuousPdf(doc, canvas, contentWidth, printableHeight, margin, hasPdfContent);
    } else {
        for (let offsetY = 0; offsetY < totalHeight; offsetY += DOCUMENT_CAPTURE_CHUNK_HEIGHT_CSS) {
            const chunkHeight = Math.min(DOCUMENT_CAPTURE_CHUNK_HEIGHT_CSS, totalHeight - offsetY);
            const canvas = await captureElementToCanvas(captureTarget, viewportWidth, captureScale, html2canvas, {
                captureSlice: { y: offsetY, height: chunkHeight },
            });
            appendCanvasToContinuousPdf(doc, canvas, contentWidth, printableHeight, margin, hasPdfContent);
        }
    }

    if (!hasPdfContent.value) {
        throw new Error('PDF export produced no content.');
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
 * Render multiple standalone slide HTML documents to one PDF, one landscape page per document.
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

    const doc = new JsPDF({ unit: 'pt', format: 'a4', orientation });
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
        options.onProgress?.(1, 1);

        if (pageSelector) {
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

        return await captureContinuousPdf(mounted, viewportWidth, orientation, pageMarginPt, html2canvas, JsPDF);
    } finally {
        mounted.container.remove();
    }
}
