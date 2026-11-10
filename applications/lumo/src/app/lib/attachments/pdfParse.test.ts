import pdfParse from './pdfParse';

type FakePage = { text: string; imageArea: number };

const OPS = {
    save: 1,
    restore: 2,
    transform: 3,
    paintFormXObjectBegin: 4,
    paintFormXObjectEnd: 5,
    paintImageXObject: 10,
    paintInlineImageXObject: 11,
    paintImageXObjectRepeat: 12,
    paintImageMaskXObject: 13,
    paintImageMaskXObjectGroup: 14,
    paintImageMaskXObjectRepeat: 15,
    paintSolidColorImageMask: 16,
};

let pages: FakePage[] = [];
const render = jest.fn();

jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
    GlobalWorkerOptions: {},
    OPS: {
        save: 1,
        restore: 2,
        transform: 3,
        paintFormXObjectBegin: 4,
        paintFormXObjectEnd: 5,
        paintImageXObject: 10,
        paintInlineImageXObject: 11,
        paintImageXObjectRepeat: 12,
        paintImageMaskXObject: 13,
        paintImageMaskXObjectGroup: 14,
        paintImageMaskXObjectRepeat: 15,
        paintSolidColorImageMask: 16,
    },
    getDocument: () => ({
        promise: Promise.resolve({
            numPages: pages.length,
            getMetadata: async () => ({ info: {}, metadata: {} }),
            getPage: async (number: number) => {
                const page = pages[number - 1]!;
                return {
                    getTextContent: async () => ({
                        items: [{ str: page.text, transform: [0, 0, 0, 0, 0, 0], height: 10 }],
                    }),
                    getViewport: () => ({ width: 100, height: 100 }),
                    getOperatorList: async () =>
                        page.imageArea > 0
                            ? {
                                  fnArray: [OPS.transform, OPS.paintImageXObject],
                                  argsArray: [[page.imageArea / 100, 0, 0, 100, 0, 0], []],
                              }
                            : { fnArray: [], argsArray: [] },
                    render: (...args: unknown[]) => {
                        render(...args);
                        return { promise: Promise.resolve() };
                    },
                    cleanup: () => undefined,
                };
            },
            destroy: async () => undefined,
        }),
    }),
}));

class FakeOffscreenCanvas {
    constructor(
        public width: number,
        public height: number
    ) {}
    getContext() {
        return { fillRect: () => undefined, fillStyle: '' };
    }
    async convertToBlob() {
        return { arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
    }
}

const TEXT = 'x'.repeat(300); // above the threshold under which a page counts as a scan
const textPage = (imageArea = 0): FakePage => ({ text: TEXT, imageArea });

beforeAll(() => {
    (globalThis as any).OffscreenCanvas = FakeOffscreenCanvas;
});

beforeEach(() => {
    render.mockClear();
});

describe('pdfParse page images', () => {
    it('renders nothing unless asked to', async () => {
        pages = [{ text: '', imageArea: 0 }];

        const result = await pdfParse(new Uint8Array(1));

        expect(result.pageImages).toEqual([]);
        expect(result.text).toContain('\n\n');
    });

    it('renders a page with hardly any text, such as a scan', async () => {
        pages = [textPage(), { text: 'Fig', imageArea: 0 }];

        const result = await pdfParse(new Uint8Array(1), { renderPageImages: true });

        expect(result.pageImages.map((p) => p.page)).toEqual([2]);
    });

    it('renders a text page only when images cover enough of it', async () => {
        // The page is 100x100 = 10000 units; 5% is a logo, 40% is a figure.
        pages = [textPage(500), textPage(4000)];

        const result = await pdfParse(new Uint8Array(1), { renderPageImages: true });

        expect(result.pageImages.map((p) => p.page)).toEqual([2]);
    });

    it('stops at the page cap', async () => {
        pages = Array.from({ length: 8 }, () => textPage(5000));

        const result = await pdfParse(new Uint8Array(1), { renderPageImages: true, maxPageImages: 3 });

        expect(result.pageImages.map((p) => p.page)).toEqual([1, 2, 3]);
        expect(result.text).toContain(TEXT);
    });

    it('in pages-only mode skips the text and stops reading once the cap is reached', async () => {
        pages = Array.from({ length: 8 }, () => textPage(5000));

        const result = await pdfParse(new Uint8Array(1), { pagesOnly: true, renderPageImages: true, maxPageImages: 2 });

        expect(result.pageImages.map((p) => p.page)).toEqual([1, 2]);
        expect(result.text).toBe('');
        expect(render).toHaveBeenCalledTimes(2);
    });

    it('in pages-only mode does not read a long document to the end', async () => {
        pages = Array.from({ length: 100 }, () => textPage());

        await pdfParse(new Uint8Array(1), { pagesOnly: true, renderPageImages: true });

        expect(render).not.toHaveBeenCalled();
    });

    it('keeps the text of a document whose page cannot be rendered', async () => {
        pages = [textPage(5000)];
        render.mockImplementationOnce(() => {
            throw new Error('canvas failed');
        });
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);

        const result = await pdfParse(new Uint8Array(1), { renderPageImages: true });

        expect(result.pageImages).toEqual([]);
        expect(result.text).toContain(TEXT);
    });
});
