import { CUSTOM_DOMAINS, transformLinkify } from '@proton/shared/lib/mail/transformLinkify';

const generateTestCaces = (domains: string[]) => {
    const testCases: { content: string; expected: string }[] = [];

    domains.forEach((domain) => {
        testCases.push({
            content: `Hello, please visit http://www.proton.${domain}`,
            expected: `Hello, please visit <a target="_blank" rel="noreferrer nofollow noopener" href="http://www.proton.${domain}">http://www.proton.${domain}</a>`,
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
        const domains = ['com', 'me', ...CUSTOM_DOMAINS];
        const testCases = generateTestCaces(domains);

        testCases.forEach(({ content, expected }) => {
            it(`should transform the content: ${content}`, () => {
                const result = transformLinkify({ content });
                expect(result).toContain(expected);
            });
        });
    });
});
