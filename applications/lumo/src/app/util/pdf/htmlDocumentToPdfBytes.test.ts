import type * as HtmlDocumentCaptureModule from '../export/htmlDocumentCapture';
import { htmlDocumentToPdfBytes, htmlSlideDocumentsToPdfBytes } from './htmlDocumentToPdfBytes';

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

const mockHtml2canvas = jest.fn(async (element: HTMLElement) => {
    return {
        width: element.offsetWidth || 794,
        height: element.offsetHeight || 400,
        toDataURL: () => {
            return 'data:image/png;base64,abc';
        },
    };
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
                height: expect.any(Number),
                windowHeight: expect.any(Number),
                scale: 1,
            })
        );
        expect(mockJsPDF).toHaveBeenCalledWith({ unit: 'pt', format: 'a4', orientation: 'portrait' });
        expect(mockAddImage).toHaveBeenCalled();
        expect(mockOutput).toHaveBeenCalledWith('arraybuffer');
    });

    it('splits very tall documents into vertical html2canvas slices', async () => {
        measureMocks.captureTargetHeight = 10000;

        mockHtml2canvas.mockImplementation(async (_element: HTMLElement, options?: { height?: number; y?: number }) => {
            return {
                width: 794,
                height: options?.height ?? 400,
                toDataURL: () => {
                    return 'data:image/png;base64,abc';
                },
            };
        });

        const html = `<!DOCTYPE html><html><head><style>.pdf-export-body { margin: 0; }</style></head><body><article class="artifact-markdown"><p>Tall document</p></article></body></html>`;

        await htmlDocumentToPdfBytes(html, { pageMarginPt: 54 });

        expect(mockHtml2canvas.mock.calls.length).toBeGreaterThan(1);
        expect(mockAddPage).toHaveBeenCalled();
        expect(mockAddImage.mock.calls.length).toBeGreaterThan(1);
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
        expect(mockJsPDF).toHaveBeenCalledWith({ unit: 'pt', format: 'a4', orientation: 'landscape' });
        expect(mockAddPage).toHaveBeenCalledTimes(1);
        expect(mockAddImage).toHaveBeenCalledTimes(2);
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
