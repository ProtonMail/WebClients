import { fitCanvasToFrame, mountExportDocument } from './htmlDocumentCapture';

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

    it('letterboxes a slide taller than 16:9 into the exact frame instead of stretching it', () => {
        const tallSlide = createCanvas(1920, 1600);

        const framed = fitCanvasToFrame(tallSlide, 1920, 1080);

        expect(framed).not.toBe(tallSlide);
        expect(framed.width).toBe(1920);
        expect(framed.height).toBe(1080);
        // The source canvas is released once drawn.
        expect(tallSlide.width).toBe(0);
    });
});
