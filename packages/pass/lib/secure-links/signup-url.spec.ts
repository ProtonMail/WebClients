import { SECURE_LINK_SIGNUP_REF, buildSecureLinkPageSignupUrl } from './signup-url';

describe('buildSecureLinkPageSignupUrl', () => {
    it('builds the ctx signup URL with passhare ref', () => {
        const url = buildSecureLinkPageSignupUrl('https://account.proton.me');

        expect(url).toBe(
            `https://account.proton.me/pass/signup?mode=ctx&cycle=1&unlimited=1&ref=${SECURE_LINK_SIGNUP_REF}`
        );
    });
});
