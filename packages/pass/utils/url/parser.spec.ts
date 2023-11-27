import { parseUrl } from './parser';

describe('URL parsers', () => {
    describe('parseUrl', () => {
        test('should handle standard url', () => {
            const result = parseUrl('https://github.com');
            expect(result.displayName).toEqual('github');
            expect(result.domain).toEqual('github.com');
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
            expect(result.isUnknownOrReserved).toEqual(false);
        });

        test('should handle standard nested subdomain url', () => {
            const result = parseUrl('https://www.account.secure.github.com');
            expect(result.displayName).toEqual('github');
            expect(result.domain).toEqual('github.com');
            expect(result.subdomain).toEqual('www.account.secure.github.com');
            expect(result.isTopLevelDomain).toEqual(false);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
            expect(result.isUnknownOrReserved).toEqual(false);
        });

        test('should consider `www` as top-level url', () => {
            const result = parseUrl('https://www.proton.me');
            expect(result.displayName).toEqual('proton');
            expect(result.domain).toEqual('proton.me');
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
            expect(result.isUnknownOrReserved).toEqual(false);
        });

        test('should handle private sub-domains', () => {
            const result = parseUrl('https://admin.github.io');
            expect(result.displayName).toEqual('admin');
            expect(result.domain).toEqual('admin.github.io');
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(true);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
            expect(result.isUnknownOrReserved).toEqual(false);
        });

        test('should handle private nested sub-domains', () => {
            const result = parseUrl('https://sub.admin.github.io');
            expect(result.displayName).toEqual('admin');
            expect(result.domain).toEqual('admin.github.io');
            expect(result.subdomain).toEqual('sub.admin.github.io');
            expect(result.isTopLevelDomain).toEqual(false);
            expect(result.isPrivate).toEqual(true);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
            expect(result.isUnknownOrReserved).toEqual(false);
        });

        test('should handle non-private sub-domains', () => {
            const result = parseUrl('https://jira.company.com');
            expect(result.displayName).toEqual('company');
            expect(result.domain).toEqual('company.com');
            expect(result.subdomain).toEqual('jira.company.com');
            expect(result.isTopLevelDomain).toEqual(false);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(true);
            expect(result.protocol).toEqual('https:');
            expect(result.isUnknownOrReserved).toEqual(false);
        });

        test('should handle localhost', () => {
            const result = parseUrl('http://localhost:8080');
            expect(result.displayName).toEqual('localhost');
            expect(result.domain).toEqual('localhost');
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(false);
            expect(result.protocol).toEqual('http:');
            expect(result.isUnknownOrReserved).toEqual(true);
        });

        test('should handle IP addresses', () => {
            const result = parseUrl('http://127.0.0.1');
            expect(result.displayName).toEqual('127.0.0.1');
            expect(result.domain).toEqual('127.0.0.1');
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(false);
            expect(result.protocol).toEqual('http:');
            expect(result.isUnknownOrReserved).toEqual(true);
        });

        test('should handle non-standard http protocols', () => {
            const result = parseUrl('ftp://ftpserver.com');
            expect(result.displayName).toEqual('ftpserver');
            expect(result.domain).toEqual('ftpserver.com');
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(true);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(false);
            expect(result.protocol).toEqual('ftp:');
            expect(result.isUnknownOrReserved).toEqual(false);
        });

        test('should return defaults if non valid url', () => {
            const result = parseUrl('invalid:://url');
            expect(result.displayName).toEqual(null);
            expect(result.domain).toEqual(null);
            expect(result.subdomain).toEqual(null);
            expect(result.isTopLevelDomain).toEqual(false);
            expect(result.isPrivate).toEqual(false);
            expect(result.isSecure).toEqual(false);
            expect(result.protocol).toEqual(null);
            expect(result.isUnknownOrReserved).toEqual(true);
        });

        const reservedDomains = [
            'alt',
            '6tisch.arpa',
            '10.in-addr.arpa',
            '16.172.in-addr.arpa',
            '17.172.in-addr.arpa',
            '18.172.in-addr.arpa',
            '19.172.in-addr.arpa',
            '20.172.in-addr.arpa',
            '21.172.in-addr.arpa',
            '22.172.in-addr.arpa',
            '23.172.in-addr.arpa',
            '24.172.in-addr.arpa',
            '25.172.in-addr.arpa',
            '26.172.in-addr.arpa',
            '27.172.in-addr.arpa',
            '28.172.in-addr.arpa',
            '29.172.in-addr.arpa',
            '30.172.in-addr.arpa',
            '31.172.in-addr.arpa',
            '168.192.in-addr.arpa',
            '170.0.0.192.in-addr.arpa',
            '171.0.0.192.in-addr.arpa',
            'ipv4only.arpa',
            '254.169.in-addr.arpa',
            '8.e.f.ip6.arpa',
            '9.e.f.ip6.arpa',
            'a.e.f.ip6.arpa',
            'b.e.f.ip6.arpa',
            'home.arpa',
            'example',
            'example.com',
            'example.net',
            'example.org',
            'invalid',
            'intranet',
            'internal',
            'private',
            'corp',
            'home',
            'lan',
            'local',
            'localhost',
            'onion',
            'test',
        ];

        test.each(reservedDomains)('should flag %s as unknown or reserved', (domain) => {
            // Raw hosts
            expect(parseUrl(domain).isUnknownOrReserved).toEqual(true);
            expect(parseUrl(`${domain}:3000`).isUnknownOrReserved).toEqual(true);
            expect(parseUrl(`sub.${domain}`).isUnknownOrReserved).toEqual(true);
            expect(parseUrl(`sub.${domain}:3000`).isUnknownOrReserved).toEqual(true);

            // Full origins
            const url = `http://${domain}`;
            expect(parseUrl(url).isUnknownOrReserved).toEqual(true);
            expect(parseUrl(`${url}:3000`).isUnknownOrReserved).toEqual(true);
            expect(parseUrl(`sub.${url}`).isUnknownOrReserved).toEqual(true);
            expect(parseUrl(`sub.${url}:3000`).isUnknownOrReserved).toEqual(true);
        });

        test.each(reservedDomains)('shouldnt flag %s subdomains as unknown or reserved', (domain) => {
            expect(parseUrl(`https://${domain}.dev`).isUnknownOrReserved).toEqual(false);
            expect(parseUrl(`${domain}.proton.me`).isUnknownOrReserved).toEqual(false);
        });
    });
});
