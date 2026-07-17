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

    it('turns single newlines into <br> (breaks: true)', () => {
        expect(renderReplyMarkdown('a\nb')).toContain('<br>');
    });
});
