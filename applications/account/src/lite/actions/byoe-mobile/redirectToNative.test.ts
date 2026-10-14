import { getNativeSuccessUrl } from './redirectToNative';

describe('getNativeSuccessUrl', () => {
    it('should add the status and email to the redirect', () => {
        expect(getNativeSuccessUrl('protonmail://connect-gmail/complete', 'john@gmail.com')).toBe(
            'protonmail://connect-gmail/complete?status=success&email=john%40gmail.com'
        );
    });

    it('should drop the query and hash already on the redirect', () => {
        expect(getNativeSuccessUrl('protonmail://connect-gmail/complete?status=error&x=1#frag', 'a@b.c')).toBe(
            'protonmail://connect-gmail/complete?status=success&email=a%40b.c'
        );
    });

    it('should encode special characters of the email', () => {
        expect(getNativeSuccessUrl('protonmail://done', 'a+b&c=d@gmail.com')).toBe(
            'protonmail://done?status=success&email=a%2Bb%26c%3Dd%40gmail.com'
        );
    });

    it.each([undefined, '', 'https://evil.com', 'javascript:alert(1)', 'http://protonmail://x'])(
        'should return undefined for %p',
        (redirect) => {
            expect(getNativeSuccessUrl(redirect, 'a@b.c')).toBeUndefined();
        }
    );
});
