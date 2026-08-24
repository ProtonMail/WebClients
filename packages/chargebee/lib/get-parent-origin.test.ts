import { getParentOrigin } from './get-parent-origin';

describe('getParentOrigin', () => {
    describe('production API subdomains', () => {
        it.each([
            ['https://mail-api.proton.me', 'https://mail.proton.me'],
            ['https://account-api.proton.me', 'https://account.proton.me'],
            ['https://calendar-api.proton.me', 'https://calendar.proton.me'],
            ['https://drive-api.proton.me', 'https://drive.proton.me'],
            ['https://account-api.proton.dev', 'https://account.proton.dev'],
            ['https://account-api.protonvpn.com', 'https://account.protonvpn.com'],
        ])('strips the -api suffix from the first label: %s -> %s', (input, expected) => {
            expect(getParentOrigin(input)).toBe(expected);
        });

        it('is the exact inverse of appending -api to the first label', () => {
            const parent = 'https://account.proton.dev';
            const api = 'https://account-api.proton.dev';
            expect(getParentOrigin(api)).toBe(parent);
        });

        it('ignores any path, search, or hash and returns only the origin', () => {
            expect(getParentOrigin('https://mail-api.proton.me/api/foo?bar=1#baz')).toBe('https://mail.proton.me');
        });

        // getApplePayCapabilities relies on this: it runs in the main app too, where the origin is already the parent.
        it('is idempotent, returning an origin with no -api label unchanged', () => {
            expect(getParentOrigin('https://account.proton.me')).toBe('https://account.proton.me');
        });
    });

    describe('only the first label is modified', () => {
        it('does not touch -api occurring in a later label', () => {
            expect(getParentOrigin('https://mail.proton-api.me')).toBe('https://mail.proton-api.me');
        });

        it('only strips the trailing -api of the first label, keeping earlier -api segments', () => {
            expect(getParentOrigin('https://my-api-thing-api.proton.me')).toBe('https://my-api-thing.proton.me');
        });

        it('does not strip -api that is not at the end of the first label', () => {
            expect(getParentOrigin('https://api-mail.proton.me')).toBe('https://api-mail.proton.me');
        });
    });

    describe('non-rewritten hosts (localhost / IP) are returned unchanged', () => {
        it.each([
            'https://localhost',
            'https://localhost:8080',
            'https://34.234.12.145',
            'https://34.234.12.145:65',
            'https://[2001:db8::8a2e:370:7334]',
            'https://[2001:db8::8a2e:370:7334]:65',
        ])('returns %s unchanged', (input) => {
            expect(getParentOrigin(input)).toBe(new URL(input).origin);
        });
    });

    describe('protocol and port are preserved', () => {
        it('preserves a non-default port', () => {
            expect(getParentOrigin('https://mail-api.proton.me:8443')).toBe('https://mail.proton.me:8443');
        });

        it('preserves the http protocol', () => {
            expect(getParentOrigin('http://mail-api.proton.me')).toBe('http://mail.proton.me');
        });

        it('drops the default https port exactly as the URL parser does', () => {
            expect(getParentOrigin('https://mail-api.proton.me:443')).toBe('https://mail.proton.me');
        });
    });

    describe('defensive edge cases', () => {
        it('does not produce an empty first label when the first label is exactly "-api"', () => {
            expect(getParentOrigin('https://-api.proton.me')).toBe('https://-api.proton.me');
        });

        it('strips -api from a single-label host with no dot', () => {
            expect(getParentOrigin('https://mail-api')).toBe('https://mail');
        });

        it('leaves a single-label host without the suffix unchanged', () => {
            expect(getParentOrigin('https://mail')).toBe('https://mail');
        });

        it('throws on an invalid origin instead of returning a wrong target', () => {
            expect(() => getParentOrigin('not a url')).toThrow();
        });
    });
});
