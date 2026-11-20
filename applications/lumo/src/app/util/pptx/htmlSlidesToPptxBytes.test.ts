// @vitest-environment jsdom
// happy-dom never fires `load` on an iframe without a URL, which the export code waits for.
import { htmlSlidesToPptxBytes } from './htmlSlidesToPptxBytes';

const mockAddImage = vi.fn();
const mockAddSlide = vi.fn(() => {
    return {
        addImage: mockAddImage,
    };
});
const mockWrite = vi.fn(async () => {
    return new ArrayBuffer(8);
});
const mockPptxGen = vi.fn(function () {
    return {
        layout: '',
        addSlide: mockAddSlide,
        write: mockWrite,
    };
});

const mockHtml2canvas = vi.fn(async (element: HTMLElement) => {
    return {
        width: element.offsetWidth || 960,
        height: element.offsetHeight || 540,
        toDataURL: () => {
            return 'data:image/png;base64,abc';
        },
    };
});

vi.mock('pptxgenjs', () => {
    return {
        __esModule: true,
        default: mockPptxGen,
    };
});

vi.mock('html2canvas', () => {
    return {
        __esModule: true,
        default: mockHtml2canvas,
    };
});

describe('htmlSlidesToPptxBytes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        document.querySelectorAll('[data-pdf-export-root]').forEach((node) => {
            node.remove();
        });
    });

    it('captures one 16:9 slide image per slide document', async () => {
        const slideDocuments = [
            `<!DOCTYPE html><html><body><section class="artifact-slide-page"><h2>One</h2></section></body></html>`,
            `<!DOCTYPE html><html><body><section class="artifact-slide-page"><h2>Two</h2></section></body></html>`,
        ];

        const bytes = await htmlSlidesToPptxBytes(slideDocuments, {
            viewportWidth: 960,
        });

        expect(bytes).toBeInstanceOf(ArrayBuffer);
        expect(mockHtml2canvas).toHaveBeenCalledTimes(2);
        expect(mockPptxGen).toHaveBeenCalledTimes(1);
        expect(mockAddSlide).toHaveBeenCalledTimes(2);
        expect(mockAddImage).toHaveBeenCalledTimes(2);
        expect(mockAddImage).toHaveBeenCalledWith({
            data: 'data:image/png;base64,abc',
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
        });
        expect(mockWrite).toHaveBeenCalledWith({ outputType: 'arraybuffer' });
    });

    it('throws when no slide documents are provided', async () => {
        await expect(htmlSlidesToPptxBytes([])).rejects.toThrow('Slide capture requires at least one slide document.');
    });

    it('reports progress while rendering slide documents', async () => {
        const onProgress = vi.fn();
        const slideDocuments = [
            `<!DOCTYPE html><html><body><section><h2>One</h2></section></body></html>`,
            `<!DOCTYPE html><html><body><section><h2>Two</h2></section></body></html>`,
        ];

        await htmlSlidesToPptxBytes(slideDocuments, {
            viewportWidth: 960,
            onProgress,
        });

        expect(onProgress).toHaveBeenCalledTimes(2);
        expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2);
        expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2);
    });
});
