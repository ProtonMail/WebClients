import { resolveMigrationDomainName, sortMigrationDomainNames } from './domains';

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
