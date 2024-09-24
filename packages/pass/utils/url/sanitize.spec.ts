import { sanitizeURL } from './sanitize';
import { MAX_HOSTNAME_LENGTH, UNSUPPORTED_SCHEMES, intoCleanHostname, intoDomainImageHostname } from './utils';

const VALID_SCHEMES = ['http:', 'https:', 'ftp:', 'ssh:', 'telnet:', 'irc:', 'magnet:'];

describe('URL validation', () => {
    describe('`isValidURL`', () => {
        test('should try to append `https://` when scheme is missing', () => {
            const { valid, url } = sanitizeURL('google.com');
            expect(valid).toBe(true);
            expect(url).toEqual('https://google.com/');
        });

        test('should auto-fix scheme through URL constructor', () => {
            const { valid, url } = sanitizeURL('https:/proton.me');
            expect(valid).toBe(true);
            expect(url).toEqual('https://proton.me/');
        });

        test('should invalidate unsupported schemes', () => {
            UNSUPPORTED_SCHEMES.forEach((scheme) => {
                expect(sanitizeURL(`${scheme}someurl`).valid).toBe(false);
                expect(sanitizeURL(`${scheme}/someurl`).valid).toBe(false);
                expect(sanitizeURL(`${scheme}//someurl`).valid).toBe(false);
                expect(sanitizeURL('someurl', scheme).valid).toBe(false);
                expect(sanitizeURL('someurl', `${scheme}/`).valid).toBe(false);
                expect(sanitizeURL('someurl', `${scheme}//`).valid).toBe(false);
            });
        });

        test('should invalidate URLs over `MAX_HOSTNAME_LENGTH`', () => {
            const url = `https://${'a'.repeat(MAX_HOSTNAME_LENGTH + 1)}.com`;
            expect(sanitizeURL(url).valid).toBe(false);
        });

        test('should accept any valid scheme', () => {
            VALID_SCHEMES.forEach((scheme) => {
                expect(sanitizeURL(`${scheme}someurl`).valid).toBe(true);
                expect(sanitizeURL(`${scheme}//someurl`).valid).toBe(true);
                expect(sanitizeURL('someurl', scheme).valid).toBe(true);
                expect(sanitizeURL('someurl', scheme).valid).toBe(true);
            });
        });

        test('should keep `www` in URL if present', () => {
            expect(sanitizeURL('www.proton.me').url).toEqual('https://www.proton.me/');
            expect(sanitizeURL('https://www.proton.me').url).toEqual('https://www.proton.me/');
            expect(sanitizeURL('https://www.proton.me/').url).toEqual('https://www.proton.me/');
            expect(sanitizeURL('www.proton.me/login').url).toEqual('https://www.proton.me/login');
        });

        test('should preserve query strings and full path', () => {
            expect(sanitizeURL('proton.me/login/?foo=bar').url).toEqual('https://proton.me/login/?foo=bar');
            expect(sanitizeURL('proton.me/login/?foo=bar', 'wss:').url).toEqual('wss://proton.me/login/?foo=bar');
            expect(sanitizeURL('https://proton.me/login/?foo=bar').url).toEqual('https://proton.me/login/?foo=bar');
        });

        test('should preserve ports', () => {
            expect(sanitizeURL('http://localhost:3000').url).toEqual('http://localhost:3000/');
            expect(sanitizeURL('https://localhost:3001?foo=bar').url).toEqual('https://localhost:3001/?foo=bar');
        });

        test('should invalidate URLs containing internal white-spaces', () => {
            expect(sanitizeURL('https://www.proton    .me').valid).toBe(false);
            expect(sanitizeURL('proton.me  /').valid).toBe(false);
            expect(sanitizeURL('www.proton.me/foo/   ?bar=10').valid).toBe(false);

            expect(sanitizeURL('proton.me  ').valid).toBe(true);
            expect(sanitizeURL('www.proton.me/foo/   ').valid).toBe(true);
        });
    });

    describe('`intoCleanHostname', () => {
        test('should return null for invalid URLs', () => {
            expect(intoCleanHostname('https://www.proton    .me')).toBe(null);
            expect(intoCleanHostname('www.proton.me/foo/   ?bar=10')).toBe(null);
            expect(intoCleanHostname('//')).toBe(null);
        });

        test('should remove leading `www.`', () => {
            expect(intoCleanHostname('proton.me')).toEqual('proton.me');
            expect(intoCleanHostname('www.proton.me')).toEqual('proton.me');
            expect(intoCleanHostname('www.proton.me/')).toEqual('proton.me');
            expect(intoCleanHostname('foo.www.proton.me/')).toEqual('foo.www.proton.me');
        });
    });

    describe('`intoDomainImageHostname`', () => {
        test('should remove leading `www.`', () => {
            expect(intoDomainImageHostname('proton.me')).toEqual('proton.me');
            expect(intoDomainImageHostname('www.proton.me')).toEqual('proton.me');
            expect(intoDomainImageHostname('www.proton.me/')).toEqual('proton.me');
            expect(intoDomainImageHostname('foo.www.proton.me/')).toEqual('foo.www.proton.me');
        });

        test('should return null for invalid URLs', () => {
            expect(intoDomainImageHostname('https://www.proton    .me')).toBe(null);
            expect(intoDomainImageHostname('www.proton.me/foo/   ?bar=10')).toBe(null);
            expect(intoDomainImageHostname('//')).toBe(null);
        });

        test.each([
            'alt',
            'invalid',
            'intranet',
            'internal',
            'private',
            'corp',
            'home',
            'lan',
            'local',
            'localhost',
            'example',
        ])('`%s` should return null [reserved]', (hostname) => {
            expect(intoDomainImageHostname(hostname)).toBe(null);
        });

        test.each([
            '6tisch.arpa',
            '10.in-addr.arpa',
            '16.172.in-addr.arpa',
            '17.172.in-addr.arpa',
            'proton.onion',
            'example.com',
            'localhost.local',
        ])('`%s` should return null [non-ICANN]', (hostname) => {
            expect(intoDomainImageHostname(hostname)).toBe(null);
            expect(intoDomainImageHostname(`${hostname}:3000`)).toBe(null);
        });

        test.each([
            '6tisch.arpa',
            '10.in-addr.arpa',
            '16.172.in-addr.arpa',
            '17.172.in-addr.arpa',
            'proton.onion',
            'example.com',
            'localhost.local',
            'xn--bcher-kva.example',
        ])('`%s` should return null [non-ICANN]', (hostname) => {
            expect(intoDomainImageHostname(hostname)).toBe(null);
            expect(intoDomainImageHostname(`${hostname}:3000`)).toBe(null);
            expect(intoDomainImageHostname(`sub.${hostname}`)).toBe(null);
            expect(intoDomainImageHostname(`sub.${hostname}:3000`)).toBe(null);
        });

        test.each([
            '192.168.23.145',
            '10.45.178.209',
            '172.16.87.231',
            '203.0.113.42',
            '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
            'fe80:0000:0000:0000:0202:b3ff:fe1e:8329',
            '0.0.0',
            '0.0',
            '0',
        ])('`%s` should return null [IP]', (hostname) => {
            expect(intoDomainImageHostname(hostname)).toBe(null);
        });
    });
});
