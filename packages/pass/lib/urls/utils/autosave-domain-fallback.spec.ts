import { domainFallbackAutosaveSiteName, getPrivateSuffixAutosaveLabels } from './autosave-domain-fallback';

describe('getPrivateSuffixAutosaveLabels', () => {
    test('returns tenant and platform for netlify.app hosts', () => {
        expect(getPrivateSuffixAutosaveLabels('https://domain1.netlify.app/')).toEqual({
            tenant: 'domain1',
            platform: 'netlify',
        });
    });

    test('returns tenant and platform for github.io hosts', () => {
        expect(getPrivateSuffixAutosaveLabels('https://tenant.github.io/')).toEqual({
            tenant: 'tenant',
            platform: 'github',
        });
    });

    test('returns null for standalone registrable domains', () => {
        expect(getPrivateSuffixAutosaveLabels('https://mail.google.com/')).toBeNull();
        expect(getPrivateSuffixAutosaveLabels('https://login.example.com/')).toBeNull();
    });
});

describe('domainFallbackAutosaveSiteName', () => {
    test('falls back to registrable domain label for multi-part TLDs', () => {
        expect(domainFallbackAutosaveSiteName('https://www.bbc.co.uk/news/article')).toBe('Bbc');
    });

    test('does not split punycode domain labels on hyphens', () => {
        expect(domainFallbackAutosaveSiteName('https://xn--80ak6aa92e.com/')).toBe('xn--80ak6aa92e');
    });

    test('uses the tenant subdomain on atlassian.net', () => {
        expect(domainFallbackAutosaveSiteName('https://acme.atlassian.net/login')).toBe('Acme');
    });

    test('uses company name only on standalone domains', () => {
        expect(domainFallbackAutosaveSiteName('https://mail.google.com/')).toBe('Google');
        expect(domainFallbackAutosaveSiteName('https://drive.google.com/')).toBe('Google');
    });

    test('uses tenant and platform on public-suffix multi-tenant hosts', () => {
        expect(domainFallbackAutosaveSiteName('https://domain1.netlify.app/')).toBe('Domain1 Netlify');
        expect(domainFallbackAutosaveSiteName('https://tenant.github.io/')).toBe('Tenant Github');
    });

    test('returns null when the URL cannot be parsed', () => {
        expect(domainFallbackAutosaveSiteName('invalid:://url')).toBeNull();
    });
});
