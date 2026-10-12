import type * as HtmlDocumentCaptureModule from '../export/htmlDocumentCapture';
import {
    computeDocumentPageStarts,
    htmlDocumentToPdfBytes,
    htmlSlideDocumentsToPdfBytes,
} from './htmlDocumentToPdfBytes';

const measureMocks = {
    captureTargetHeight: undefined as number | undefined,
};

jest.mock('../export/htmlDocumentCapture', () => {
    const actual = jest.requireActual('../export/htmlDocumentCapture') as typeof HtmlDocumentCaptureModule;

    return {
        ...actual,
        measureCaptureTargetHeight: (target: HTMLElement) => {
            if (measureMocks.captureTargetHeight !== undefined) {
                return measureMocks.captureTargetHeight;
            }

            return actual.measureCaptureTargetHeight(target);
        },
    };
});

const mockAddImage = jest.fn();
const mockAddPage = jest.fn();
const mockOutput = jest.fn(() => {
    return new ArrayBuffer(8);
});
const mockGetWidth = jest.fn(() => {
    return 595;
});
const mockGetHeight = jest.fn(() => {
    return 842;
});

const mockJsPDF = jest.fn(() => {
    return {
        internal: {
            pageSize: {
                getWidth: mockGetWidth,
                getHeight: mockGetHeight,
            },
        },
        addImage: mockAddImage,
        addPage: mockAddPage,
        output: mockOutput,
    };
});

const createCanvas = (width: number, height: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
};

const mockHtml2canvas = jest.fn(async (element: HTMLElement, options?: { height?: number }) => {
    return createCanvas(element.offsetWidth || 794, options?.height ?? (element.offsetHeight || 400));
});

jest.mock('jspdf', () => {
    return {
        jsPDF: mockJsPDF,
    };
});

jest.mock('html2canvas', () => {
    return {
        __esModule: true,
        default: mockHtml2canvas,
    };
});

describe('htmlDocumentToPdfBytes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        measureMocks.captureTargetHeight = undefined;
        mockGetWidth.mockReturnValue(595);
        mockGetHeight.mockReturnValue(842);
    });

    afterEach(() => {
        document.querySelectorAll('[data-pdf-export-root]').forEach((node) => {
            node.remove();
        });
    });

    it('mounts export HTML off-screen and captures the markdown body at full height', async () => {
        const html = `<!DOCTYPE html><html><head><style>.pdf-export-body { margin: 0; }</style></head><body><article class="artifact-markdown"><p>Document body</p></article></body></html>`;

        await htmlDocumentToPdfBytes(html);

        expect(document.querySelector('[data-pdf-export-root]')).toBeNull();
        expect(mockHtml2canvas).toHaveBeenCalledTimes(1);
        const captureTarget = mockHtml2canvas.mock.calls[0]?.[0] as HTMLElement | undefined;
        expect(captureTarget?.className).toBe('artifact-markdown');
        const captureOptions = (mockHtml2canvas.mock.calls[0] as unknown[] | undefined)?.[1] as
            Record<string, unknown> | undefined;
        expect(captureOptions).toEqual(
            expect.objectContaining({
                y: 0,
                height: expect.any(Number),
                scale: 2,
            })
        );
        expect(mockJsPDF).toHaveBeenCalledWith({ unit: 'pt', format: 'a4', orientation: 'portrait' });
        expect(mockAddImage).toHaveBeenCalled();
        expect(mockOutput).toHaveBeenCalledWith('arraybuffer');
    });

    it('captures one page-sized slice per PDF page and keeps every slice inside the margins', async () => {
        measureMocks.captureTargetHeight = 10000;

        const html = `<!DOCTYPE html><html><head><style>.pdf-export-body { margin: 0; }</style></head><body><article class="artifact-markdown"><p>Tall document</p></article></body></html>`;
        const onProgress = jest.fn();

        await htmlDocumentToPdfBytes(html, { pageMarginPt: 54, onProgress });

        // 595 × 842pt page, 54pt margins → 487 × 734pt content box → 734 × 794 / 487 ≈ 1196.6 CSS px per page.
        const pageHeightCss = ((842 - 108) * 794) / (595 - 108);
        const expectedPages = Math.ceil(10000 / pageHeightCss);
        expect(mockHtml2canvas).toHaveBeenCalledTimes(expectedPages);
        expect(mockAddPage).toHaveBeenCalledTimes(expectedPages - 1);
        expect(onProgress).toHaveBeenLastCalledWith(expectedPages, expectedPages);

        const sliceOffsets = mockHtml2canvas.mock.calls.map((call) => {
            return (call[1] as { y: number }).y;
        });
        expect(sliceOffsets[0]).toBe(0);
        expect(sliceOffsets[1]).toBeCloseTo(pageHeightCss);

        mockAddImage.mock.calls.forEach((call) => {
            const [, , x, y, width, height] = call as [string, string, number, number, number, number];
            expect(x).toBe(54);
            expect(y).toBe(54);
            expect(width).toBe(595 - 108);
            expect(y + height).toBeLessThanOrEqual(842 - 54 + 0.001);
        });
    });

    it('captures each matched page separately when pageSelector is provided', async () => {
        const html = `<!DOCTYPE html>
<html><body>
<div class="artifact-slides-export">
  <section class="artifact-slide-page"><h2>One</h2></section>
  <section class="artifact-slide-page"><h2>Two</h2></section>
</div>
</body></html>`;

        await htmlDocumentToPdfBytes(html, {
            viewportWidth: 960,
            orientation: 'landscape',
            pageSelector: '.artifact-slides-export > section.artifact-slide-page',
        });

        expect(mockHtml2canvas).toHaveBeenCalledTimes(2);
        expect(mockJsPDF).toHaveBeenCalledWith({ unit: 'pt', format: 'a4', orientation: 'landscape' });
        expect(mockAddPage).toHaveBeenCalledTimes(1);
        expect(mockAddImage).toHaveBeenCalledTimes(2);
    });

    it('throws when pageSelector matches no elements', async () => {
        const html = `<!DOCTYPE html><html><body><p>No slides</p></body></html>`;

        await expect(
            htmlDocumentToPdfBytes(html, {
                pageSelector: '.artifact-slide-page',
            })
        ).rejects.toThrow('No PDF pages matched selector');
    });

    it('strips script nodes before capture', async () => {
        const html = `<!DOCTYPE html><html><body><p>Safe</p><script>window.exportScriptRan = true</script></body></html>`;

        await htmlDocumentToPdfBytes(html);

        expect((window as Window & { exportScriptRan?: boolean }).exportScriptRan).toBeUndefined();
    });
});

describe('htmlSlideDocumentsToPdfBytes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetWidth.mockReturnValue(595);
        mockGetHeight.mockReturnValue(842);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.querySelectorAll('[data-pdf-export-root]').forEach((node) => {
            node.remove();
        });
    });

    it('captures one landscape page per slide document', async () => {
        const slideDocuments = [
            `<!DOCTYPE html><html><body><section class="artifact-slide-page"><h2>One</h2></section></body></html>`,
            `<!DOCTYPE html><html><body><section class="artifact-slide-page"><h2>Two</h2></section></body></html>`,
        ];

        await htmlSlideDocumentsToPdfBytes(slideDocuments, {
            viewportWidth: 960,
            orientation: 'landscape',
        });

        expect(mockHtml2canvas).toHaveBeenCalledTimes(2);
        expect(mockJsPDF).toHaveBeenCalledWith({ unit: 'pt', format: [960, 540], orientation: 'landscape' });
        expect(mockAddPage).toHaveBeenCalledTimes(1);
        expect(mockAddImage).toHaveBeenCalledTimes(2);
    });

    it('fits slides onto a full-bleed 16:9 page', async () => {
        mockGetWidth.mockReturnValue(960);
        mockGetHeight.mockReturnValue(540);
        mockHtml2canvas.mockImplementation(async () => {
            return createCanvas(1920, 1080);
        });
        // jsdom has no canvas backend, so toDataURL would otherwise return null.
        jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AA==');

        await htmlSlideDocumentsToPdfBytes(
            [`<!DOCTYPE html><html><body><section class="artifact-slide-page"><h2>One</h2></section></body></html>`],
            { viewportWidth: 960, orientation: 'landscape' }
        );

        expect(mockAddImage).toHaveBeenCalledWith(expect.any(String), 'PNG', 0, 0, 960, 540);
    });

    it('throws when no slide documents are provided', async () => {
        await expect(htmlSlideDocumentsToPdfBytes([])).rejects.toThrow(
            'Presentation PDF export requires at least one slide.'
        );
    });

    it('reports progress while rendering slide documents', async () => {
        const onProgress = jest.fn();
        const slideDocuments = [
            `<!DOCTYPE html><html><body><section><h2>One</h2></section></body></html>`,
            `<!DOCTYPE html><html><body><section><h2>Two</h2></section></body></html>`,
            `<!DOCTYPE html><html><body><section><h2>Three</h2></section></body></html>`,
        ];

        await htmlSlideDocumentsToPdfBytes(slideDocuments, {
            viewportWidth: 960,
            orientation: 'landscape',
            onProgress,
        });

        expect(onProgress).toHaveBeenCalledTimes(3);
        expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3);
        expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3);
        expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3);
    });
});

describe('computeDocumentPageStarts', () => {
    it('returns a single page when the content fits', () => {
        expect(computeDocumentPageStarts([100, 200], 900, 1000)).toEqual([0]);
    });

    it('breaks at the last block boundary that fits instead of mid-line', () => {
        // Blocks start at 0, 400, 950, 1300, 1800; page height 1000.
        expect(computeDocumentPageStarts([400, 950, 1300, 1800], 2100, 1000)).toEqual([0, 950, 1800]);
    });

    it('cuts at the page limit when no boundary leaves the page at least 30% full', () => {
        // Only boundary on page one is at 100 (10% full) — one oversized block follows it.
        expect(computeDocumentPageStarts([100], 2500, 1000)).toEqual([0, 1000, 2000]);
    });

    it('ignores boundaries outside the content and tolerates unsorted input', () => {
        expect(computeDocumentPageStarts([1500, -5, 0, 700, 5000], 1800, 1000)).toEqual([0, 700, 1500]);
    });
});
