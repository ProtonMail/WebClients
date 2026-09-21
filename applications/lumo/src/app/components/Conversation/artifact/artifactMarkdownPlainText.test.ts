import { htmlToPlainText, markdownToPlainText } from './artifactMarkdownPlainText';

jest.mock('./artifactMarkdownHtml', () => {
    return {
        markdownToHtmlBody: (markdown: string) => {
            return `<h1>Title</h1><p>First paragraph.</p><ul><li>One</li><li>Two</li></ul><p>${markdown}</p>`;
        },
    };
});

describe('htmlToPlainText', () => {
    it('formats headings, paragraphs, and lists', () => {
        const plainText = htmlToPlainText(
            '<h2>Section</h2><p>Intro text.</p><ul><li>Alpha</li><li>Beta</li></ul><ol><li>First</li><li>Second</li></ol>'
        );

        expect(plainText).toContain('Section');
        expect(plainText).toContain('Intro text.');
        expect(plainText).toContain('- Alpha');
        expect(plainText).toContain('- Beta');
        expect(plainText).toContain('1. First');
        expect(plainText).toContain('2. Second');
        expect(plainText).not.toContain('<');
    });

    it('formats table rows as tab-separated values', () => {
        const plainText = htmlToPlainText(
            '<table><tr><th>Name</th><th>Value</th></tr><tr><td>Alpha</td><td>1</td></tr></table>'
        );

        expect(plainText).toContain('Name\tValue');
        expect(plainText).toContain('Alpha\t1');
    });
});

describe('markdownToPlainText', () => {
    it('converts markdown through the HTML renderer before extracting plain text', () => {
        const plainText = markdownToPlainText('# Title\n\nBody');

        expect(plainText).toContain('Title');
        expect(plainText).toContain('First paragraph.');
        expect(plainText).toContain('- One');
        expect(plainText).toContain('Body');
    });
});
