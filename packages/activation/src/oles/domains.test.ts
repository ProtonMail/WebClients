import { getRecordHost, getSubdomain, resolveMigrationDomainName, sortMigrationDomainNames } from './domains';

describe('getSubdomain', () => {
    it.each([
        ['example.com', ''],
        ['example.co.uk', ''],
        ['mail.example.com', 'mail'],
        ['mail.example.co.uk', 'mail'],
        ['a.b.example.com', 'a.b'],
        ['EXAMPLE.COM', ''],
        ['mail.EXAMPLE.com', 'mail'],
    ])('detects the subdomain of "%s" as "%s"', (domainName, expected) => {
        expect(getSubdomain(domainName)).toBe(expected);
    });

    it.each([undefined, '', '   '])('returns "" for the non-domain value %p', (value) => {
        expect(getSubdomain(value as string | undefined)).toBe('');
    });
});

describe('getRecordHost', () => {
    describe('without a subdomain (root domain)', () => {
        it.each([
            ['', ''],
            [undefined, ''],
            ['_dmarc', '_dmarc'],
            ['sel._domainkey', 'sel._domainkey'],
        ])('leaves the base host "%s" unchanged', (host, expected) => {
            expect(getRecordHost(host, '')).toBe(expected);
            expect(getRecordHost(host, undefined)).toBe(expected);
        });
    });

    describe('with a subdomain', () => {
        it('uses the subdomain itself when the base host is blank', () => {
            expect(getRecordHost('', 'mail')).toBe('mail');
            expect(getRecordHost(undefined, 'mail')).toBe('mail');
        });

        it('prepends the subdomain to a non-empty base host', () => {
            expect(getRecordHost('_dmarc', 'mail')).toBe('_dmarc.mail');
            expect(getRecordHost('sel._domainkey', 'mail')).toBe('sel._domainkey.mail');
        });

        it('supports multi-label subdomains', () => {
            expect(getRecordHost('', 'a.b')).toBe('a.b');
            expect(getRecordHost('_dmarc', 'a.b')).toBe('_dmarc.a.b');
        });
    });
});

describe('resolveMigrationDomainName', () => {
    const domainNames = ['example.com', 'Other.com', 'third.org'];

    it('returns the selected domain when available', () => {
        expect(resolveMigrationDomainName(domainNames, 'third.org')).toBe('third.org');
    });

    it("returns the provider's spelling of the selected domain", () => {
        expect(resolveMigrationDomainName(domainNames, 'other.COM')).toBe('Other.com');
    });

    it.each([undefined, 'gone.com'])('falls back to the first domain when the selection is %p', (selected) => {
        expect(resolveMigrationDomainName(domainNames, selected)).toBe('example.com');
    });

    it('returns undefined when there is no domain', () => {
        expect(resolveMigrationDomainName([], 'example.com')).toBeUndefined();
    });
});

describe('sortMigrationDomainNames', () => {
    it("puts the admin account's domain first, then sorts alphabetically", () => {
        expect(sortMigrationDomainNames(['zeta.com', 'Beta.com', 'admin.org', 'alpha.com'], 'ADMIN.org')).toEqual([
            'admin.org',
            'alpha.com',
            'Beta.com',
            'zeta.com',
        ]);
    });

    it("sorts alphabetically when the admin account's domain is not in the list", () => {
        expect(sortMigrationDomainNames(['zeta.com', 'alpha.com'], 'tenant.onmicrosoft.com')).toEqual([
            'alpha.com',
            'zeta.com',
        ]);
    });

    it('does not change the given list', () => {
        const domainNames = ['b.com', 'a.com'];
        sortMigrationDomainNames(domainNames, undefined);
        expect(domainNames).toEqual(['b.com', 'a.com']);
    });
});
