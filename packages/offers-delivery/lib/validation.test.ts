import { sanitizeHttpsUrl, sanitizeImageUrl } from './validation';

describe('sanitizeHttpsUrl', () => {
    it.each([
        ['https url', 'https://cdn.proton.me/a.png', 'https://cdn.proton.me/a.png'],
        ['http url', 'http://cdn.proton.me/a.png', null],
        ['javascript url', 'javascript:alert(1)', null],
        ['data url', 'data:image/png;base64,AAAA', null],
        ['protocol-relative', '//evil.com/a.png', null],
        ['garbage', 'not a url', null],
        ['empty', '', null],
        ['null', null, null],
        ['undefined', undefined, null],
        ['embedded credentials', 'https://user:pass@evil.com/a.png', null],
        ['embedded username only', 'https://user@evil.com/a.png', null],
    ] as const)('%s', (_label, input, expected) => {
        expect(sanitizeHttpsUrl(input)).toBe(expected);
    });
});

describe('sanitizeImageUrl', () => {
    it.each([
        ['allowed cdn host', 'https://proton.me/a.png', 'https://proton.me/a.png'],
        ['allowed cdn subdomain', 'https://cdn.proton.me/a.png', 'https://cdn.proton.me/a.png'],
        ['arbitrary https host', 'https://evil.com/a.png', null],
        ['similar-looking host', 'https://notproton.me/a.png', null],
        ['http on allowed host', 'http://proton.me/a.png', null],
        ['null', null, null],
    ] as const)('%s', (_label, input, expected) => {
        expect(sanitizeImageUrl(input)).toBe(expected);
    });
});

/* Regression guard for the allowlist's suffix matching — `isSubDomain` is
 * `h === d || h.endsWith('.' + d)`, and a naive `includes`/`endsWith(d)` would
 * admit every host below. */
describe('sanitizeImageUrl host allowlist bypasses', () => {
    it.each([
        ['suffix without dot boundary', 'https://evilproton.me/a.png'],
        ['allowlisted host as a subdomain of an attacker domain', 'https://proton.me.evil.com/a.png'],
        ['allowlisted host in the path', 'https://evil.com/proton.me/a.png'],
        ['allowlisted host as userinfo', 'https://proton.me@evil.com/a.png'],
        ['trailing dot', 'https://proton.me./a.png'],
    ] as const)('%s', (_label, input) => {
        expect(sanitizeImageUrl(input)).toBeNull();
    });
});
