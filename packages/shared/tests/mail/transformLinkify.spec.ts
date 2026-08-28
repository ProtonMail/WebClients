import { CUSTOM_TLDS } from '../../lib/mail/linkifyInstance';
import { transformLinkify } from '../../lib/mail/transformLinkify';

const generateTestCaces = (domains: string[]) => {
    const testCases: { content: string; expected: string }[] = [];

    domains.forEach((domain) => {
        testCases.push({
            content: `Hello, please visit https://www.proton.${domain}`,
            expected: `Hello, please visit <a target="_blank" rel="noreferrer nofollow noopener" href="https://www.proton.${domain}">https://www.proton.${domain}</a>`,
        });
    });

    domains.forEach((domain) => {
        testCases.push({
            content: `Send me an email at: fake.name@proton.${domain}`,
            expected: `Send me an email at: <a target="_blank" rel="noreferrer nofollow noopener" href="mailto:fake.name@proton.${domain}">fake.name@proton.${domain}</a>`,
        });
    });

    return testCases;
};

describe('transformLinkify', () => {
    describe('when having default and custom domains', () => {
        const domains = ['com', 'me', ...CUSTOM_TLDS];
        const testCases = generateTestCaces(domains);

        testCases.forEach(({ content, expected }) => {
            it(`should transform the content: ${content}`, () => {
                const result = transformLinkify({ content });
                expect(result).toContain(expected);
            });
        });
    });

    describe('when a matched URL contains quote characters', () => {
        // linkify-it allows a balanced pair of quotes inside a URL path, so the matched
        // URL and link text must be escaped or they break out of `href="..."`.
        const parseAnchor = (html: string) => {
            const container = document.createElement('div');
            container.innerHTML = html;
            return container.querySelector('a');
        };

        it('does not let a quoted URL inject an attribute into the anchor', () => {
            const result = transformLinkify({
                content: 'Hi https://example.com/"onmouseover="alert(1)" bye',
            });

            expect(result).toContain('&quot;onmouseover=&quot;');

            const anchor = parseAnchor(result);
            expect(anchor?.getAttribute('onmouseover')).toBeNull();
            expect(anchor?.getAttributeNames().sort()).toEqual(['href', 'rel', 'target']);
        });

        it('keeps the quoted URL intact in the href and the link text', () => {
            const url = 'https://example.com/"onmouseover="alert(1)';
            const anchor = parseAnchor(transformLinkify({ content: url }));

            expect(anchor?.getAttribute('href')).toBe(url);
            expect(anchor?.textContent).toBe(url);
        });

        it('escapes ampersands in query strings without corrupting the URL', () => {
            const url = 'https://example.com/?a=1&b=2';
            const result = transformLinkify({ content: url });

            expect(result).toContain('href="https://example.com/?a=1&amp;b=2"');
            expect(parseAnchor(result)?.getAttribute('href')).toBe(url);
        });
    });

    describe('when given disallowed schemes', () => {
        it('does not linkify URLs starting with http://', () => {
            // http: is disabled on the shared LinkifyIt instance — cleartext
            // URLs must render as escaped plain text, not as an anchor.
            const result = transformLinkify({ content: 'visit http://insecure.test today' });

            expect(result).not.toContain('<a');
            expect(result).toBe('visit http://insecure.test today');
        });

        it('does not linkify URLs starting with ftp://', () => {
            // ftp: is disabled on the shared LinkifyIt instance.
            const result = transformLinkify({ content: 'fetch ftp://files.test now' });

            expect(result).not.toContain('<a');
            expect(result).toBe('fetch ftp://files.test now');
        });
    });
});
