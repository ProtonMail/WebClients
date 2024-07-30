import type { BackLink } from '@proton/shared/lib/interfaces/securityCheckup';

import getBackLink from './getBackLink';

describe('getBackLink', () => {
    test('throws error if href is not a valid url', () => {
        expect(() => {
            getBackLink({
                backHref: 'asdf',
                hostname: 'account.proton.me',
            });
        }).toThrow();
    });

    test('throws error if href hostname is not the same as hostname', () => {
        expect(() => {
            getBackLink({
                backHref: 'https://straightouttacrompton.dev',
                hostname: 'account.proton.me',
            });
        }).toThrow();
    });

    test('returns continue link if the continue href is the same hostname as expected', () => {
        const result = getBackLink({
            backHref: 'https://account.proton.me/asdf',
            hostname: 'account.proton.me',
        });

        const expected: BackLink = {
            to: '/asdf',
            href: 'https://account.proton.me/asdf',
            app: undefined,
        };
        expect(result).toEqual(expected);
    });

    test('returns undefined app for account application', () => {
        const result = getBackLink({
            backHref: 'https://account.proton.me',
            hostname: 'account.proton.me',
        });

        const expected: BackLink = {
            to: '/',
            href: 'https://account.proton.me/',
            app: undefined,
        };
        expect(result).toEqual(expected);
    });

    test('returns undefined app if application is not in ALLOWED_APPS', () => {
        const result = getBackLink({
            backHref: 'https://verify.proton.me',
            hostname: 'verify.proton.me',
        });

        const expected: BackLink = {
            to: '/',
            href: 'https://verify.proton.me/',
            app: undefined,
        };
        expect(result).toEqual(expected);
    });

    test('returns correct app if application is in ALLOWED_APPS', () => {
        const result = getBackLink({
            backHref: 'https://mail.proton.me',
            hostname: 'mail.proton.me',
        });

        const expected: BackLink = {
            to: '/',
            href: 'https://mail.proton.me/',
            app: 'proton-mail',
        };
        expect(result).toEqual(expected);
    });
});
