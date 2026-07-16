import { isTrustedProtonLink } from './trustedLinks';

describe('isTrustedProtonLink', () => {
    it.each([
        'https://proton.me/support/common-login-problems',
        'https://account.proton.me/reset-password',
        'https://lumo.proton.me/legal/terms',
        'https://protonvpn.com/support/streaming-guide/',
        'https://www.proton.me/blog/drive-for-linux',
        'https://protonmail.com',
        'https://pm.me',
    ])('returns true for trusted Proton link %s', (url) => {
        expect(isTrustedProtonLink(url)).toBe(true);
    });

    it.each([
        'https://example.com',
        'https://pr0t0n.me/support',
        'https://notproton.me.evil.com',
        'https://proton.me.evil.com',
        'http://protonvpn.com.evil.com',
        'not-a-url',
    ])('returns false for untrusted link %s', (url) => {
        expect(isTrustedProtonLink(url)).toBe(false);
    });
});
