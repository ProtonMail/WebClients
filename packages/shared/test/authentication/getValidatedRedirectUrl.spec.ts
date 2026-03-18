import { getValidatedRedirectUrl } from '../../lib/authentication/fork/getValidatedRedirectUrl';
import { APPS } from '../../lib/constants';

const makeUrl = (href: string) => new URL(href);

const call = (redirectUrl: string, url: string, app = APPS.PROTONMAIL) =>
    getValidatedRedirectUrl({ redirectUrl, url: makeUrl(url), app });

const href = (result: ReturnType<typeof call>) => result?.href;

describe('getValidatedRedirectUrl', () => {
    describe('proton custom protocol redirect', () => {
        [
            {
                name: 'should build proton-mail URL preserving path, search, and hash from current url',
                redirectUrl: 'proton-mail://',
                url: 'https://mail.proton.me/u/0/inbox?search=foo#anchor',
                output: 'proton-mail://u/0/inbox?search=foo#anchor',
            },
            {
                name: 'should use proton:// protocol and strip leading slash from pathname',
                redirectUrl: 'proton://',
                url: 'https://mail.proton.me/u/1/sent',
                output: 'proton://u/1/sent',
            },
            {
                name: 'should use protonmail:// protocol',
                redirectUrl: 'protonmail://',
                url: 'https://mail.proton.me/u/0',
                output: 'protonmail://u/0',
            },
            {
                name: 'should apply search params from current url to proton protocol URL',
                redirectUrl: 'proton-mail://',
                url: 'https://mail.proton.me/u/0/drafts?filter=unread',
                output: 'proton-mail://u/0/drafts?filter=unread',
            },
            {
                name: 'should return undefined for non-proton protocol even if it looks similar',
                redirectUrl: 'proton-mail-evil://',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
        ].forEach(({ name, redirectUrl, url, output }) => {
            it(name, () => {
                expect(href(call(redirectUrl, url))).toBe(output);
            });
        });
    });

    describe('localhost http redirect', () => {
        [
            {
                name: 'should allow http://localhost and copy pathname from current url when redirect path is root on black',
                redirectUrl: 'http://localhost/',
                url: 'https://mail.proton.black/u/0/inbox',
                output: 'http://localhost/u/0/inbox',
            },
            {
                name: 'should allow http://localhost with port and root path on pink',
                redirectUrl: 'http://localhost:3000/',
                url: 'https://mail.proton.pink/u/0/inbox?q=test',
                output: 'http://localhost:3000/u/0/inbox?q=test',
            },
            {
                name: 'should keep existing non-root pathname on localhost redirect and apply search from current url on black',
                redirectUrl: 'http://localhost:8080/login',
                url: 'https://mail.einstein.proton.black/u/0/inbox?token=abc#section',
                output: 'http://localhost:8080/login?token=abc#section',
            },
            {
                name: 'should return undefined for http://localhost with port and root path on onion production domain',
                redirectUrl: 'http://localhost:3000/',
                url: 'https://mail.protonmailrmez3lotccipshtkleegetolb73fuirgj7r4o4vfu7ozyd.onion/u/0/inbox?q=test',
                output: undefined,
            },
            {
                name: 'should return undefined for http://localhost when current url is on a production domain',
                redirectUrl: 'http://localhost/',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
            {
                name: 'should return undefined for http on a non-localhost hostname',
                redirectUrl: 'http://mail.proton.me/',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
            {
                name: 'should return undefined for http on an external domain',
                redirectUrl: 'http://evil.com/',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
        ].forEach(({ name, redirectUrl, url, output }) => {
            it(name, () => {
                expect(href(call(redirectUrl, url))).toBe(output);
            });
        });
    });

    describe('https redirect on same hostname', () => {
        [
            {
                name: 'should allow redirect to same hostname with root path replaced by current pathname',
                redirectUrl: 'https://mail.proton.me/',
                url: 'https://mail.proton.me/u/0/inbox',
                output: 'https://mail.proton.me/u/0/inbox',
            },
            {
                name: 'should keep non-root redirect pathname but apply search and hash from current url',
                redirectUrl: 'https://mail.proton.me/settings',
                url: 'https://mail.proton.me/u/0/inbox?token=xyz#top',
                output: 'https://mail.proton.me/settings?token=xyz#top',
            },
            {
                name: 'should overwrite any existing search in redirect url with current url search',
                redirectUrl: 'https://mail.proton.me/?existing=ignored',
                url: 'https://mail.proton.me/u/0/inbox?actual=1',
                output: 'https://mail.proton.me/u/0/inbox?actual=1',
            },
        ].forEach(({ name, redirectUrl, url, output }) => {
            it(name, () => {
                expect(href(call(redirectUrl, url))).toBe(output);
            });
        });
    });

    describe('https redirect with new- prefix', () => {
        [
            {
                name: 'should allow redirect to new-prefixed hostname on same domain',
                redirectUrl: 'https://new-mail.proton.me/callback',
                url: 'https://mail.proton.me/login?a=b',
                output: 'https://new-mail.proton.me/callback?a=b',
            },
            {
                name: 'should allow new- prefixed redirect and preserve path from redirect url when non-root',
                redirectUrl: 'https://new-mail.proton.me/settings/account',
                url: 'https://mail.proton.me/u/0/inbox?ref=42',
                output: 'https://new-mail.proton.me/settings/account?ref=42',
            },
        ].forEach(({ name, redirectUrl, url, output }) => {
            it(name, () => {
                expect(href(call(redirectUrl, url))).toBe(output);
            });
        });
    });

    describe('rejected https redirects', () => {
        [
            {
                name: 'should return undefined for a different proton subdomain (not new-)',
                redirectUrl: 'https://mail.proton.com/',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
            {
                name: 'should return undefined for a different proton subdomain (not new-)',
                redirectUrl: 'https://calendar.proton.me/',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
            {
                name: 'should return undefined for a completely different domain',
                redirectUrl: 'https://evil.com/',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
            {
                name: 'should return undefined for a domain that only shares a suffix',
                redirectUrl: 'https://notproton.me/',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
            {
                name: 'should return undefined for double-new prefix',
                redirectUrl: 'https://new-new-mail.proton.me/',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
        ].forEach(({ name, redirectUrl, url, output }) => {
            it(name, () => {
                expect(href(call(redirectUrl, url))).toBe(output);
            });
        });
    });

    describe('invalid or unsupported redirects', () => {
        [
            {
                name: 'should return undefined for an empty redirect url',
                redirectUrl: '',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
            {
                name: 'should return undefined for a non-parseable redirect url',
                redirectUrl: 'not a url',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
            {
                name: 'should return undefined for ftp protocol',
                redirectUrl: 'ftp://mail.proton.me/',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
            {
                name: 'should return undefined for javascript: protocol',
                redirectUrl: 'javascript:alert(1)',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
            {
                name: 'should return undefined for path-relative redirect attempt',
                redirectUrl: '/\\\\evil.com',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
            {
                name: 'should return undefined for evil-new prefix',
                redirectUrl: 'https://new-mail.evil.me/',
                url: 'https://mail.proton.me/u/0/inbox',
                output: undefined,
            },
        ].forEach(({ name, redirectUrl, url, output }) => {
            it(name, () => {
                expect(href(call(redirectUrl, url))).toBe(output);
            });
        });
    });
});
