import { parseUrl } from './parser';

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
    });
});
