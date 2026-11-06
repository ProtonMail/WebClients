import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';

import { maybeSetAppSubdomainFromRedirectUrl } from './setAppSubdomainFromRedirectUrl';

const MAIL_APP = APPS.PROTONMAIL;

const originalMailSubdomain = APPS_CONFIGURATION[MAIL_APP].subdomain;

const makeUrl = (href: string, redirectUrl?: string) => {
    const url = new URL(href);
    if (redirectUrl !== undefined) {
        url.searchParams.set('redirectUrl', redirectUrl);
    }
    return url;
};

describe('setAppSubdomainFromRedirectUrl', () => {
    afterEach(() => {
        APPS_CONFIGURATION[MAIL_APP].subdomain = originalMailSubdomain;
    });

    it('does nothing when there is no redirectUrl param', () => {
        maybeSetAppSubdomainFromRedirectUrl(makeUrl('https://account.proton.me/mail/dashboard'));

        expect(APPS_CONFIGURATION[MAIL_APP].subdomain).toBe(originalMailSubdomain);
    });

    it('does nothing when the pathname does not map to an app', () => {
        maybeSetAppSubdomainFromRedirectUrl(makeUrl('https://account.proton.me/signup', 'https://new-mail.proton.me/'));

        expect(APPS_CONFIGURATION[MAIL_APP].subdomain).toBe(originalMailSubdomain);
    });

    it('updates the app subdomain for a valid "new-" prefixed redirect url', () => {
        maybeSetAppSubdomainFromRedirectUrl(
            makeUrl('https://account.proton.me/mail/dashboard', 'https://new-mail.proton.me/')
        );

        expect(APPS_CONFIGURATION[MAIL_APP].subdomain).toBe('new-mail');
    });

    it('keeps the subdomain when the redirect url points to the same host', () => {
        maybeSetAppSubdomainFromRedirectUrl(
            makeUrl('https://account.proton.me/mail/dashboard', 'https://mail.proton.me/')
        );

        expect(APPS_CONFIGURATION[MAIL_APP].subdomain).toBe('mail');
    });

    it('does nothing when the redirect url is on a different second-level domain', () => {
        maybeSetAppSubdomainFromRedirectUrl(
            makeUrl('https://account.proton.me/mail/dashboard', 'https://new-mail.evil.com/')
        );

        expect(APPS_CONFIGURATION[MAIL_APP].subdomain).toBe(originalMailSubdomain);
    });

    it('does nothing when the redirect url is not https', () => {
        maybeSetAppSubdomainFromRedirectUrl(
            makeUrl('https://account.proton.me/mail/dashboard', 'http://new-mail.proton.me/')
        );

        expect(APPS_CONFIGURATION[MAIL_APP].subdomain).toBe(originalMailSubdomain);
    });

    it('does nothing when the redirect host is neither the same nor "new-" prefixed', () => {
        maybeSetAppSubdomainFromRedirectUrl(
            makeUrl('https://account.proton.me/mail/dashboard', 'https://evil-mail.proton.me/')
        );

        expect(APPS_CONFIGURATION[MAIL_APP].subdomain).toBe(originalMailSubdomain);
    });

    it('rejects a localhost redirect on a production proton domain', () => {
        maybeSetAppSubdomainFromRedirectUrl(
            makeUrl('https://account.proton.me/mail/dashboard', 'http://localhost:8080/')
        );

        expect(APPS_CONFIGURATION[MAIL_APP].subdomain).toBe(originalMailSubdomain);
    });

    it('rejects a localhost redirect on a non-production domain', () => {
        maybeSetAppSubdomainFromRedirectUrl(
            makeUrl('https://account.proton.local/mail/dashboard', 'http://localhost:8080/')
        );

        expect(APPS_CONFIGURATION[MAIL_APP].subdomain).toBe('mail');
    });
});
