import { captureElementToCanvas, fitCanvasToFrame, mountExportDocument } from './htmlDocumentCapture';

describe('mountExportDocument', () => {
    afterEach(() => {
        document.querySelectorAll('[data-pdf-export-root]').forEach((node) => {
            node.remove();
        });
    });

    it('mounts export HTML in a sandboxed iframe without allow-scripts', async () => {
        const html = `<!DOCTYPE html><html><head><style>.pdf-export-body { margin: 0; }</style></head><body><article class="artifact-markdown"><p>Document body</p></article></body></html>`;

        const mounted = await mountExportDocument(html, 794);

        expect(mounted.container.querySelector('[data-pdf-export-iframe]')).toBeInstanceOf(HTMLIFrameElement);
        expect(mounted.iframe.getAttribute('sandbox')).toBe('allow-same-origin');
        expect(mounted.root.className).toBe('pdf-export-body');
        expect(mounted.root.querySelector('.artifact-markdown')).not.toBeNull();
        expect(mounted.ownerDocument).toBe(mounted.iframe.contentDocument);
    });

    it('strips script tags from the mounted export document', async () => {
        const html = `<!DOCTYPE html><html><head></head><body><script>window.exportExploit = true</script><p>Safe</p></body></html>`;

        const mounted = await mountExportDocument(html, 794);

        expect(mounted.ownerDocument.querySelector('script')).toBeNull();
        expect(mounted.root.textContent).toContain('Safe');
    });
});

describe('captureElementToCanvas', () => {
    afterEach(() => {
        document.querySelectorAll('[data-pdf-export-root], [data-capture-clone]').forEach((node) => node.remove());
    });

    it.each([undefined, { y: 1200, height: 100 }])(
        'captures the sandboxed export iframe from its parent (slice: %j)',
        async (slice) => {
            const mounted = await mountExportDocument(
                '<!doctype html><html><body><p>Sample document</p></body></html>',
                794
            );
            const canvas = document.createElement('canvas');
            const clonedFrame = document.createElement('iframe');
            clonedFrame.setAttribute('data-capture-clone', 'true');
            clonedFrame.setAttribute('sandbox', mounted.iframe.getAttribute('sandbox')!);
            document.body.appendChild(clonedFrame);
            const render = jest.fn(async (_target: HTMLElement, options: Record<string, unknown>) => {
                const onclone = options.onclone as
                    ((document: Document, target: HTMLElement) => Promise<void>) | undefined;
                await onclone?.(document, clonedFrame);
                return canvas;
            });

            const result = await captureElementToCanvas(mounted.root, 794, 2, render, {
                captureHeight: 200,
                captureSlice: slice,
            });

            expect(render.mock.calls[0]![0]).toBe(mounted.iframe);
            expect(result).toBe(canvas);
            expect(clonedFrame.contentDocument?.body.textContent).toContain('Sample document');
            expect(clonedFrame.width).toBe('794');
            expect(clonedFrame.height).toBe(String(slice?.height ?? 200));
            expect(clonedFrame.contentDocument?.compatMode).toBe('CSS1Compat');
            expect(clonedFrame.contentDocument?.documentElement.style.transform).toBe(
                `translate(0px, ${-(slice?.y ?? 0)}px)`
            );
            expect(render.mock.calls[0]![1]).toEqual(
                expect.objectContaining({
                    x: 0,
                    y: 0,
                    height: slice?.height ?? 200,
                })
            );
            expect(clonedFrame.getAttribute('sandbox')).toBe('allow-same-origin');
        }
    );
});

describe('fitCanvasToFrame', () => {
    const createCanvas = (width: number, height: number): HTMLCanvasElement => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    };

    it('returns a canvas that already has the frame aspect unchanged', () => {
        const canvas = createCanvas(1920, 1080);

        expect(fitCanvasToFrame(canvas, 1920, 1080)).toBe(canvas);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('letterboxes a slide taller than 16:9 into the exact frame instead of stretching it', () => {
        // jsdom has no canvas backend, so stand in a 2D context that records the draw.
        const context = { fillStyle: '', fillRect: jest.fn(), drawImage: jest.fn() };
        jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
            context as unknown as CanvasRenderingContext2D
        );
        const tallSlide = createCanvas(1920, 1600);

        const framed = fitCanvasToFrame(tallSlide, 1920, 1080);

        expect(framed).not.toBe(tallSlide);
        expect(framed.width).toBe(1920);
        expect(framed.height).toBe(1080);
        // Scaled to the frame height and centred horizontally, not stretched to the full width.
        expect(context.drawImage).toHaveBeenCalledWith(tallSlide, 312, 0, 1296, 1080);
        // The source canvas is released once drawn.
        expect(tallSlide.width).toBe(0);
    });
});
