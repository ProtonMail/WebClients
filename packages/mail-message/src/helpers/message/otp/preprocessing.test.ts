import { clean, collapseTagWhitespace, parse, prepareBody, prune } from './preprocessing';

describe('OTP preprocessing', () => {
    describe('prune', () => {
        it('drops script, style, head, meta and noscript elements', () => {
            const doc = prune(
                parse(
                    '<html><head><meta charset="utf-8"></head><body>' +
                        '<script>s()</script><style>.a{}</style><noscript>n</noscript><p>ok</p>' +
                        '</body></html>'
                )
            );
            expect(doc.querySelector('script')).toBeNull();
            expect(doc.querySelector('style')).toBeNull();
            expect(doc.querySelector('meta')).toBeNull();
            expect(doc.querySelector('noscript')).toBeNull();
            expect(doc.querySelector('p')?.textContent).toBe('ok');
        });

        it('removes elements hidden via style', () => {
            for (const style of ['display:none', 'visibility:hidden', 'opacity:0', 'max-height:0']) {
                const doc = prune(parse(`<body><div style="${style}">x</div><p>shown</p></body>`));
                expect(doc.querySelector('div')).toBeNull();
                expect(doc.querySelector('p')).not.toBeNull();
            }
        });
    });

    describe('clean', () => {
        it('strips invisible characters and collapses whitespace', () => {
            // zero-width space U+200B is written as an escape so the source stays readable.
            expect(clean('  a\u200Bb\tc  ')).toBe('ab c');
        });

        it('applies NFKC normalization', () => {
            expect(clean('１２３')).toBe('123'); // full-width digits
            expect(clean('ﬁ')).toBe('fi'); // ligature
        });
    });

    describe('collapseTagWhitespace', () => {
        it('strips quotes and whitespace adjacent to tag boundaries', () => {
            expect(collapseTagWhitespace('<p> 123456 </p>')).toBe('<p>123456</p>');
            expect(collapseTagWhitespace('<a href="x">1</a>')).toBe('<a href=x>1</a>');
        });
    });

    describe('prepareBody', () => {
        it('splits sibling text nodes with a space for HTML bodies', () => {
            const prepared = prepareBody('html', '<span>021</span><span>667</span>');
            expect(prepared.doc).not.toBeNull();
            expect(prepared.segments).toEqual(['021', '667']);
            expect(prepared.visibleText).toBe('021 667');
        });

        it('derives collapsedHtml for HTML bodies and an empty string for plaintext', () => {
            expect(prepareBody('html', '<p> 123456 </p>').collapsedHtml).toBe('<p>123456</p>');
            expect(prepareBody('plain', 'line1\nline2').collapsedHtml).toBe('');
        });

        it('uses raw lines for plaintext bodies', () => {
            const prepared = prepareBody('plain', 'line1\nline2');
            expect(prepared.doc).toBeNull();
            expect(prepared.visibleText).toBe('line1\nline2');
            expect(prepared.segments).toEqual(['line1', 'line2']);
        });
    });
});
