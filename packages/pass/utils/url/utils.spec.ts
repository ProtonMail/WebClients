import { parseUrl } from '@proton/pass/utils/url/parser';

import {
    UNSUPPORTED_SCHEMES,
    globToRegExp,
    intoCleanHostname,
    intoDomainImageHostname,
    intoDomainWithPort,
    isSupportedSenderUrl,
    isTotpUri,
    isValidScheme,
    urlEq,
} from './utils';

describe('URL utils', () => {
    describe('`isTotpUri`', () => {
        test('returns true for valid TOTP URIs', () => {
            expect(isTotpUri('otpauth://totp/Example:alice@google.com')).toBe(true);
            expect(isTotpUri('otpauth://hotp/Example:alice@google.com')).toBe(true);
        });

        test('returns false for invalid TOTP URIs', () => {
            expect(isTotpUri('https://example.com')).toBe(false);
            expect(isTotpUri('otp://something')).toBe(false);
            expect(isTotpUri('otpauthx://invalid')).toBe(false);
            expect(isTotpUri('')).toBe(false);
        });
    });

    describe('`isValidScheme`', () => {
        test.each(['http:', 'https:', 'ftp:', 'ws:'])('returns true for valid schemes: %s', (scheme) =>
            expect(isValidScheme(new URL(`${scheme}//example.com`))).toBe(true)
        );

        test.each(UNSUPPORTED_SCHEMES)('returns false for unsupported schemes: %s', (scheme) =>
            expect(isValidScheme(new URL(`${scheme}//example.com`))).toBe(false)
        );

        test('returns false for undefined input', () => expect(isValidScheme(undefined)).toBe(false));
    });

    describe('`urlEq`', () => {
        test('returns true when all components are equal', () => {
            const a = { domain: 'example.com', port: '443', protocol: 'https:' };
            const b = { domain: 'example.com', port: '443', protocol: 'https:' };
            expect(urlEq(a, b)).toBe(true);
        });

        test('returns false when domains differ', () => {
            const a = { domain: 'example.com', port: '443', protocol: 'https:' };
            const b = { domain: 'example.org', port: '443', protocol: 'https:' };
            expect(urlEq(a, b)).toBe(false);
        });

        test('returns false when ports differ', () => {
            const a = { domain: 'example.com', port: '443', protocol: 'https:' };
            const b = { domain: 'example.com', port: '80', protocol: 'https:' };
            expect(urlEq(a, b)).toBe(false);
        });

        test('returns false when protocols differ', () => {
            const a = { domain: 'example.com', port: '443', protocol: 'https:' };
            const b = { domain: 'example.com', port: '443', protocol: 'http:' };
            expect(urlEq(a, b)).toBe(false);
        });
    });

    describe('`isSupportedSenderUrl`', () => {
        test.each([
            ['http://example.com', true],
            ['https://example.com:443', true],
            ['https://subdomain.example.com', true],
            ['https://', false],
            ['invalid url', false],
        ])('"%s" returns %s', (url, expected) => expect(isSupportedSenderUrl(parseUrl(url))).toBe(expected));
    });

    describe('`intoCleanHostname`', () => {
        test.each([
            ['https://www.example.com', 'example.com'],
            ['http://Example.com', 'example.com'],
            ['https://sub.DOMAIN.com', 'sub.domain.com'],
            ['https://www.example.com?param1=value1&param2=value2', 'example.com'],
            ['http://example.com/path/to/page?query=123', 'example.com'],
            ['https://sub.domain.com:8080/login?user=test#section', 'sub.domain.com'],
            ['www.test-site.co.uk?ref=homepage&lang=en', 'test-site.co.uk'],
            ['https://www.example.com?', 'example.com'],
            ['http://example.com#fragment', 'example.com'],
            ['https://', null],
            ['', null],
        ])('"%s" returns "%s"', (input, expected) => expect(intoCleanHostname(input)).toBe(expected));
    });

    describe('`intoDomainImageHostname`', () => {
        test.each([
            /* Valid cases */
            ['http://sub.domain.co.uk', 'sub.domain.co.uk'],
            ['https://www.site.com?param=value', 'site.com'],
            ['https://sub.domain.net:8080/login?user=test#section', 'sub.domain.net'],
            ['http://www.site.onion.com', 'site.onion.com'],
            ['https://123.com', '123.com'],
            ['http://sub.123.45.com', 'sub.123.45.com'],
            ['https://sub.domain.local.com', 'sub.domain.local.com'],

            /* Cases that should return null */
            ['http://localhost', null],
            ['https://www.example.com', null],
            ['https://192.168.1.1', null],
            ['http://10.0.0.1', null],
            ['https://www.site.com.arpa', null],
            ['https://example.arpa', null],
            ['http://hidden.onion', null],
            ['https://mysite.local', null],
            ['http://test.example.com', null],
            ['https://test.example.org', null],
            ['http://test.example.net', null],
            ['https://site', null],
            ['invalid-url', null],
            ['', null],
        ])('"%s" returns "%s"', (input, expected) => expect(intoDomainImageHostname(input)).toBe(expected));
    });

    describe('`intoDomainWithPort`', () => {
        test.each([
            /* Valid cases */
            [{ domain: 'example.com', port: '80', protocol: 'http:' }, 'http://example.com/'],
            [{ domain: 'example.com', port: '443', protocol: 'https:' }, 'https://example.com/'],
            [{ domain: 'example.com', port: '', protocol: 'https:' }, 'https://example.com/'],
            [{ domain: 'sub.domain.com', port: '8080', protocol: 'http:' }, 'http://sub.domain.com:8080/'],
            [{ domain: 'example.co.uk', port: '', protocol: 'https:' }, 'https://example.co.uk/'],
            [{ domain: 'localhost', port: '8080', protocol: 'http:' }, 'http://localhost:8080/'],
            [{ domain: '192.168.1.1', port: '80', protocol: 'http:' }, 'http://192.168.1.1/'],
            [{ domain: '[2001:db8::1]', port: '3000', protocol: 'https:' }, 'https://[2001:db8::1]:3000/'],
            [{ domain: 'example.com', port: '65535', protocol: 'https:' }, 'https://example.com:65535/'],
            [{ domain: 'example.com', port: '0', protocol: 'http:' }, 'http://example.com:0/'],

            /* Cases without port */
            [{ domain: 'example.com', port: null, protocol: 'http:' }, 'http://example.com/'],
            [{ domain: 'example.com', port: null, protocol: 'https:' }, 'https://example.com/'],

            /* Cases that should return null */
            [{ domain: '', port: '80', protocol: 'http:' }, null],
            [{ domain: 'example.com', port: '80', protocol: null }, null],
            [{ domain: 'example.com', port: null, protocol: null }, null],
            [{ domain: null, port: null, protocol: null }, null],
        ])('"%s" returns "%s"', (input, expected) => expect(intoDomainWithPort(input)).toBe(expected));
    });
    describe('`globToRegExp`', () => {
        test.each([
            ['*.config.js', 'webpack.production.config.js'],
            ['*.css', 'styles/theme/dark.css'],
            ['*.example.com', 'sub.example.com'],
            ['*.example.com', 'sub.sub.example.com'],
            ['docs/*/*.md', 'docs/api/auth.md'],
            ['example.com', 'example.com'],
            ['foo*.bar', 'foo.bar'],
            ['foo*.bar', 'fooANYTHING.bar'],
            ['path/*/file.txt', 'path/to/subdir/file.txt'],
            ['path/to/*.js', 'path/to/file.js'],
            ['src/*.ts', 'src/components/button.ts'],
            ['styles/*.css', 'styles/theme/dark.css'],
            ['test/*/spec.js', 'test/unit/auth/spec.js'],
        ])('"%s" matches "%s"', (pattern, value) => expect(globToRegExp(pattern).test(value)).toBe(true));

        test.each([
            ['*.example.com', 'example.com'],
            ['*.min.js', 'app.js'],
            ['example.co?', 'example.co.uk'],
            ['example.com', 'example.org'],
            ['foo*.bar', 'fo.bar'],
        ])('"%s" does not match "%s"', (pattern, value) => expect(globToRegExp(pattern).test(value)).toBe(false));
    });
});
