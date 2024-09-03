import { escapeInvalidHtmlTags } from './sanitize';

describe('escapeInvalidHtmlTags', () => {
    it('should escape invalid HTML tags', () => {
        const input = 'Test <salut> <b>hello</b> </salut>';
        const output = 'Test &lt;salut&gt; <b>hello</b> &lt;/salut&gt;';
        expect(escapeInvalidHtmlTags(input)).toBe(output);
    });

    it('should escape standalone brackets', () => {
        const input = '<only one bracket <b>before</b>';
        const output = '&lt;only one bracket <b>before</b>';
        expect(escapeInvalidHtmlTags(input)).toBe(output);
    });

    it('should escape standalone brackets', () => {
        const input = 'only <b>one</b> bracket after>';
        const output = 'only <b>one</b> bracket after&gt;';
        expect(escapeInvalidHtmlTags(input)).toBe(output);
    });
});
