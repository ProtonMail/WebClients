import { generateDomainCombinations, parseUrl } from './parser';

describe('URL parsers', () => {
    describe('parseUrl', () => {
        test('should handle standard url', () => {
            const result = parseUrl('https://github.com');
            expect(result.displayName).toEqual('github');
            expect(result.domain).toEqual('github.com');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
        });

        test('should handle standard nested subdomain url', () => {
            const result = parseUrl('https://www.account.secure.github.com');
            expect(result.displayName).toEqual('github');
            expect(result.domain).toEqual('github.com');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual('www.account.secure.github.com');
            expect(result.isTopLevelDomain).toEqual(false);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
        });

        test('should handle url with port', () => {
            const result = parseUrl('https://localhost:3001');
            expect(result.displayName).toEqual('localhost');
            expect(result.domain).toEqual('localhost');
            expect(result.port).toEqual('3001');
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
        });

        test('should consider `www` as top-level url', () => {
            const result = parseUrl('https://www.proton.me');
            expect(result.displayName).toEqual('proton');
            expect(result.domain).toEqual('proton.me');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
        });

        test('should handle private sub-domains', () => {
            const result = parseUrl('https://admin.github.io');
            expect(result.displayName).toEqual('admin');
            expect(result.domain).toEqual('admin.github.io');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(true);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
        });

        test('should handle private nested sub-domains', () => {
            const result = parseUrl('https://sub.admin.github.io');
            expect(result.displayName).toEqual('admin');
            expect(result.domain).toEqual('admin.github.io');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual('sub.admin.github.io');
            expect(result.isTopLevelDomain).toEqual(false);
            expect(result.isPrivate).toEqual(true);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
        });

        test('should handle non-private sub-domains', () => {
            const result = parseUrl('https://jira.company.com');
            expect(result.displayName).toEqual('company');
            expect(result.domain).toEqual('company.com');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual('jira.company.com');
            expect(result.isTopLevelDomain).toEqual(false);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
        });

        test('should handle localhost', () => {
            const result = parseUrl('http://localhost:8080');
            expect(result.displayName).toEqual('localhost');
            expect(result.domain).toEqual('localhost');
            expect(result.port).toEqual('8080');
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(false);
            expect(result.protocol).toEqual('http:');
        });

        test('should handle IP addresses', () => {
            const result = parseUrl('http://127.0.0.1');
            expect(result.displayName).toEqual('127.0.0.1');
            expect(result.domain).toEqual('127.0.0.1');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(false);
            expect(result.protocol).toEqual('http:');
        });

        test('should handle non-standard http protocols', () => {
            const result = parseUrl('ftp://ftpserver.com');
            expect(result.displayName).toEqual('ftpserver');
            expect(result.domain).toEqual('ftpserver.com');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(false);
            expect(result.protocol).toEqual('ftp:');
        });

        test('should return defaults if non valid url', () => {
            const result = parseUrl('invalid:://url');
            expect(result.displayName).toEqual(null);
            expect(result.domain).toEqual(null);
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(false);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(false);
            expect(result.protocol).toEqual(null);
        });

        test('should respect custom private domains with single subdomain', () => {
            const result = parseUrl('https://chicken.food.blog', new Set(['food.blog']));
            expect(result.displayName).toEqual('chicken');
            expect(result.domain).toEqual('chicken.food.blog');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(true);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
        });

        test('should respect custom private domains at root level', () => {
            const result = parseUrl('https://food.blog', new Set(['food.blog']));
            expect(result.displayName).toEqual('food');
            expect(result.domain).toEqual('food.blog');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(true);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
        });

        test('should respect custom private domains with multiple subdomains', () => {
            let result = parseUrl('https://sub.chicken.food.blog', new Set(['chicken.food.blog']));
            expect(result.displayName).toEqual('sub');
            expect(result.domain).toEqual('sub.chicken.food.blog');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(true);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');

            result = parseUrl('https://deep.sub.chicken.food.blog', new Set(['chicken.food.blog']));
            expect(result.displayName).toEqual('sub');
            expect(result.domain).toEqual('sub.chicken.food.blog');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual('deep.sub.chicken.food.blog');
            expect(result.isTopLevelDomain).toEqual(false);
            expect(result.isPrivate).toEqual(true);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
        });

        test('should respect custom private domains with nested subdomains', () => {
            let result = parseUrl('https://sub.chicken.food.blog', new Set(['food.blog']));
            expect(result.displayName).toEqual('chicken');
            expect(result.domain).toEqual('chicken.food.blog');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual('sub.chicken.food.blog');
            expect(result.isTopLevelDomain).toEqual(false);
            expect(result.isPrivate).toEqual(true);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');

            result = parseUrl('https://deep.sub.chicken.food.blog', new Set(['food.blog']));
            expect(result.displayName).toEqual('chicken');
            expect(result.domain).toEqual('chicken.food.blog');
            expect(result.port).toEqual(null);
            expect(result.subdomain).toEqual('deep.sub.chicken.food.blog');
            expect(result.isTopLevelDomain).toEqual(false);
            expect(result.isPrivate).toEqual(true);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
        });
    });

    describe('generateDomainCombinations', () => {
        test('should yield only domain when subdomain is missing', () => {
            let result = Array.from(generateDomainCombinations('example.com', null));
            expect(result).toEqual([['example.com']]);

            result = Array.from(generateDomainCombinations('example.com', undefined));
            expect(result).toEqual([['example.com']]);

            result = Array.from(generateDomainCombinations('example.com', ''));
            expect(result).toEqual([['example.com']]);
        });

        test('should generate combinations for single subdomain', () => {
            const result = Array.from(generateDomainCombinations('example.com', 'www'));
            expect(result).toEqual([['example.com', 'www'], ['www.example.com']]);
        });

        test('should generate combinations for nested subdomains', () => {
            const result = Array.from(generateDomainCombinations('example.com', 'a.b.c'));
            expect(result).toEqual([
                ['example.com', 'c', 'b', 'a'],
                ['c.example.com', 'b', 'a'],
                ['b.c.example.com', 'a'],
                ['a.b.c.example.com'],
            ]);
        });
    });
});
