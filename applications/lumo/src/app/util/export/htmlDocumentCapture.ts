import { yieldToMainThread } from './exportUiHelpers';

const DEFAULT_VIEWPORT_WIDTH = 794;
const DEFAULT_CAPTURE_SCALE = 2;
/** Faster capture for multi-slide exports — scale 2 rarely improves slide PDF/PPTX quality. */
export const PRESENTATION_CAPTURE_SCALE = 1;

/** Class applied to the off-screen mount point that wraps export body content during capture. */
export const PDF_EXPORT_BODY_CLASS = 'pdf-export-body';

export type SlideCaptureProgressCallback = (current: number, total: number) => void;

export interface HtmlSlideCaptureOptions {
    /** Fixed layout width in CSS pixels before capture. */
    viewportWidth?: number;
    /** html2canvas scale factor. */
    scale?: number;
    /** Called as each slide is processed during export. */
    onProgress?: SlideCaptureProgressCallback;
}

export interface MountedExportDocument {
    container: HTMLDivElement;
    iframe: HTMLIFrameElement;
    root: HTMLElement;
    ownerDocument: Document;
}

type Html2CanvasFn = (element: HTMLElement, options: Record<string, unknown>) => Promise<HTMLCanvasElement>;

async function waitForLayoutSettle(): Promise<void> {
    await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                resolve();
            });
        });
    });
}

async function waitForDocumentFonts(ownerDocument: Document): Promise<void> {
    await ownerDocument.fonts?.ready;
}

function stripScriptNodes(root: ParentNode): void {
    root.querySelectorAll('script').forEach((node) => {
        node.remove();
    });
}

function stripScriptsFromHtmlDocument(htmlDocument: string): string {
    const parsed = new DOMParser().parseFromString(htmlDocument, 'text/html');
    stripScriptNodes(parsed);

    const doctype = parsed.doctype ? `<!DOCTYPE ${parsed.doctype.name}>\n` : '';
    return `${doctype}${parsed.documentElement.outerHTML}`;
}

function ensureExportRoot(iframeDocument: Document): HTMLElement {
    const existingRoot = iframeDocument.body.querySelector(`.${PDF_EXPORT_BODY_CLASS}`);
    if (existingRoot instanceof HTMLElement) {
        return existingRoot;
    }

    const root = iframeDocument.createElement('div');
    root.className = PDF_EXPORT_BODY_CLASS;
    while (iframeDocument.body.firstChild) {
        root.appendChild(iframeDocument.body.firstChild);
    }
    iframeDocument.body.appendChild(root);

    return root;
}

async function waitForExportIframe(iframe: HTMLIFrameElement): Promise<Document> {
    if (iframe.contentDocument?.body) {
        return iframe.contentDocument;
    }

    await new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            reject(new Error('Export iframe failed to load.'));
        }, 5000);

        iframe.addEventListener(
            'load',
            () => {
                window.clearTimeout(timeoutId);
                resolve();
            },
            { once: true }
        );
    });

    const iframeDocument = iframe.contentDocument;
    if (!iframeDocument?.body) {
        throw new Error('Export iframe document is unavailable.');
    }

    return iframeDocument;
}

function syncIframeHeight(mounted: MountedExportDocument): void {
    const contentHeight = measureExportContentHeight(mounted.root);
    mounted.iframe.style.height = `${contentHeight}px`;
}

async function populateExportIframeDocument(iframe: HTMLIFrameElement, htmlDocument: string): Promise<Document> {
    iframe.src = 'about:blank';
    const ownerDocument = await waitForExportIframe(iframe);

    ownerDocument.open();
    ownerDocument.write(htmlDocument);
    ownerDocument.close();

    if (!ownerDocument.body) {
        throw new Error('Export iframe document is unavailable.');
    }

    return ownerDocument;
}

/**
 * Mount export HTML in a hidden sandboxed iframe in the current document.
 * Model content is sanitized upstream; this path also strips any `<script>` nodes defensively
 * and uses `sandbox="allow-same-origin"` without `allow-scripts` so inline handlers cannot run.
 */
export async function mountExportDocument(htmlDocument: string, viewportWidth: number): Promise<MountedExportDocument> {
    const sanitizedHtmlDocument = stripScriptsFromHtmlDocument(htmlDocument);

    const container = document.createElement('div');
    container.setAttribute('data-pdf-export-root', 'true');
    // Keep in-viewport but behind the UI — far off-screen mounts and opacity/visibility:hidden break html2canvas.
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.zIndex = '-1';
    container.style.width = `${viewportWidth}px`;
    container.style.background = '#ffffff';
    container.style.boxSizing = 'border-box';
    container.style.overflow = 'visible';
    container.style.pointerEvents = 'none';

    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.setAttribute('data-pdf-export-iframe', 'true');
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.style.width = `${viewportWidth}px`;
    iframe.style.height = '1px';
    iframe.style.overflow = 'visible';

    container.appendChild(iframe);
    document.body.appendChild(container);

    const ownerDocument = await populateExportIframeDocument(iframe, sanitizedHtmlDocument);
    stripScriptNodes(ownerDocument);
    const root = ensureExportRoot(ownerDocument);

    return { container, iframe, root, ownerDocument };
}

export async function prepareMountedExport(mounted: MountedExportDocument): Promise<void> {
    await waitForDocumentFonts(mounted.ownerDocument);
    await waitForLayoutSettle();

    // Let content define its own height — pinning scrollHeight can under-measure and clip html2canvas output.
    mounted.root.style.boxSizing = 'border-box';
    mounted.root.style.width = '100%';
    mounted.root.style.overflow = 'visible';
    mounted.root.style.height = 'auto';
    mounted.root.style.minHeight = '0';
    mounted.container.style.overflow = 'visible';
    mounted.container.style.height = 'auto';
    syncIframeHeight(mounted);

    await waitForLayoutSettle();
}

export function isHTMLElement(node: Element | null, ownerDocument: Document): node is HTMLElement {
    if (!node) {
        return false;
    }

    const HtmlElement = ownerDocument.defaultView?.HTMLElement;
    if (HtmlElement) {
        return node instanceof HtmlElement;
    }

    return node.nodeType === Node.ELEMENT_NODE;
}

/** Prefer the markdown article as the capture target so height measurement matches rendered content. */
export function getDocumentCaptureTarget(mounted: MountedExportDocument): HTMLElement {
    const article = mounted.root.querySelector('.artifact-markdown');

    if (isHTMLElement(article, mounted.ownerDocument)) {
        return article;
    }

    return mounted.root;
}

export function measureCaptureTargetHeight(target: HTMLElement): number {
    return Math.max(target.scrollHeight, target.offsetHeight, 1);
}

/** Measure the full laid-out export height, preferring the markdown article when present. */
export function measureExportContentHeight(root: HTMLElement): number {
    const article = root.querySelector('.artifact-markdown');
    const ownerDocument = root.ownerDocument;
    const measureTarget = isHTMLElement(article, ownerDocument) ? article : root;

    return Math.max(measureTarget.scrollHeight, measureTarget.offsetHeight, root.scrollHeight, root.offsetHeight, 1);
}

export interface CaptureSliceOptions {
    y: number;
    height: number;
}

export interface CaptureElementToCanvasOptions {
    /** When true, size the capture to the element's full scroll height (for multi-page documents). */
    captureFullHeight?: boolean;
    /** Capture a vertical slice of the element (for chunked document export). */
    captureSlice?: CaptureSliceOptions;
    /** Override the measured capture height in CSS pixels. */
    captureHeight?: number;
}

export async function captureElementToCanvas(
    target: HTMLElement,
    viewportWidth: number,
    scale: number,
    html2canvas: Html2CanvasFn,
    options: CaptureElementToCanvasOptions = {}
): Promise<HTMLCanvasElement> {
    const captureWidth = Math.max(target.scrollWidth, target.offsetWidth, viewportWidth);
    const captureHeight =
        options.captureHeight ??
        Math.max(target.scrollHeight, target.offsetHeight, target.getBoundingClientRect().height, 1);

    const html2canvasOptions: Record<string, unknown> = {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: captureWidth,
    };

    if (options.captureSlice) {
        const slice = options.captureSlice;
        html2canvasOptions.x = 0;
        html2canvasOptions.y = slice.y;
        html2canvasOptions.width = captureWidth;
        html2canvasOptions.height = slice.height;
        html2canvasOptions.windowHeight = slice.height;
    } else if (options.captureFullHeight) {
        html2canvasOptions.width = captureWidth;
        html2canvasOptions.height = captureHeight;
        html2canvasOptions.windowHeight = captureHeight;
    }

    return html2canvas(target, html2canvasOptions);
}

/** Capture a vertical slice by shifting content up inside a clipped viewport. */
export async function captureExportViewportChunk(
    mounted: MountedExportDocument,
    offsetY: number,
    chunkHeight: number,
    viewportWidth: number,
    scale: number,
    html2canvas: Html2CanvasFn
): Promise<HTMLCanvasElement> {
    const { iframe, root } = mounted;
    const fullHeight = measureExportContentHeight(root);

    root.style.transform = `translateY(-${offsetY}px)`;
    iframe.style.height = `${chunkHeight}px`;
    iframe.style.overflow = 'hidden';

    await waitForLayoutSettle();

    try {
        return await html2canvas(iframe, {
            scale,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            windowWidth: viewportWidth,
            width: viewportWidth,
            height: chunkHeight,
            windowHeight: chunkHeight,
        });
    } finally {
        root.style.transform = '';
        iframe.style.height = `${fullHeight}px`;
        iframe.style.overflow = 'visible';
    }
}

export async function captureSingleSlideDocument(
    slideDocument: string,
    viewportWidth: number,
    scale: number,
    html2canvas: Html2CanvasFn
): Promise<HTMLCanvasElement> {
    const mounted = await mountExportDocument(slideDocument, viewportWidth);

    try {
        await prepareMountedExport(mounted);
        return await captureElementToCanvas(mounted.root, viewportWidth, scale, html2canvas);
    } finally {
        mounted.container.remove();
    }
}

/**
 * Mount and capture each standalone slide HTML document to a canvas.
 * Used by both PDF and PPTX presentation export paths.
 */
export async function captureSlideDocumentsToCanvases(
    slideDocuments: string[],
    options: HtmlSlideCaptureOptions = {}
): Promise<HTMLCanvasElement[]> {
    if (typeof document === 'undefined') {
        throw new Error('HTML slide capture requires a browser environment.');
    }

    if (slideDocuments.length === 0) {
        throw new Error('Slide capture requires at least one slide document.');
    }

    const viewportWidth = options.viewportWidth ?? DEFAULT_VIEWPORT_WIDTH;
    const scale = options.scale ?? PRESENTATION_CAPTURE_SCALE;

    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default as Html2CanvasFn;

    const canvases: HTMLCanvasElement[] = [];

    for (let index = 0; index < slideDocuments.length; index++) {
        options.onProgress?.(index + 1, slideDocuments.length);
        await yieldToMainThread();

        const canvas = await captureSingleSlideDocument(slideDocuments[index], viewportWidth, scale, html2canvas);
        canvases.push(canvas);
    }

    return canvases;
}

export { DEFAULT_CAPTURE_SCALE, DEFAULT_VIEWPORT_WIDTH };
