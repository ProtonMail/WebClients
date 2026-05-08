import { CUSTOM_TLDS } from '@proton/shared/lib/mail/linkifyInstance';
import { transformLinkify } from '@proton/shared/lib/mail/transformLinkify';

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
