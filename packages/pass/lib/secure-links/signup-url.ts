export const SECURE_LINK_SIGNUP_REF = 'passhare';

/** Signup URL for unauthenticated visitors on the public secure-link page. */
export const buildSecureLinkPageSignupUrl = (ssoUrl: string) => {
    const params = new URLSearchParams({
        mode: 'ctx',
        cycle: '1',
        unlimited: '1',
        ref: SECURE_LINK_SIGNUP_REF,
    });
    return `${ssoUrl}/pass/signup?${params.toString()}`;
};
