import { STATIC_PREVIEW_CSP, buildStaticPreviewDocument } from './libraryStaticPreview';

const parse = (html: string) => {
    return new DOMParser().parseFromString(html, 'text/html');
};

const PAGE = `<!DOCTYPE html><html><head><script>alert(1)</script><title>Launch</title></head>
<body onload="alert(2)"><h1>Launch faster</h1><img src="x" onerror="alert(3)"><button onClick="go()">Go</button>
<script src="https://cdn.example/app.js"></script></body></html>`;

describe('buildStaticPreviewDocument', () => {
    it('puts a script-blocking policy first in the head', () => {
        const doc = parse(buildStaticPreviewDocument(PAGE, 'webpage'));
        const first = doc.head.firstElementChild;

        expect(first?.getAttribute('http-equiv')).toBe('Content-Security-Policy');
        expect(first?.getAttribute('content')).toBe(STATIC_PREVIEW_CSP);
    });

    it('drops scripts and inline handlers but keeps the content', () => {
        const output = buildStaticPreviewDocument(PAGE, 'webpage');
        const doc = parse(output);

        expect(doc.querySelectorAll('script')).toHaveLength(0);
        expect(output).not.toMatch(/\son[a-z]+=/i);
        expect(doc.querySelector('h1')?.textContent).toBe('Launch faster');
        expect(doc.title).toBe('Launch');
        expect(output.startsWith('<!DOCTYPE html>')).toBe(true);
    });

    it("shows a deck's first slide without reveal.js", () => {
        const deck =
            '<html><head></head><body><div class="reveal"><div class="slides"><section>One</section></div></div></body></html>';
        const doc = parse(buildStaticPreviewDocument(deck, 'presentation'));

        expect(doc.head.querySelector('style')?.textContent).toContain('section:first-of-type');
        expect(parse(buildStaticPreviewDocument(PAGE, 'webpage')).head.querySelector('style')).toBeNull();
    });
});
