import { mountExportDocument } from './htmlDocumentCapture';

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
