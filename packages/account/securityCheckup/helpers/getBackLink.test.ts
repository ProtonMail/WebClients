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

    describe('href', () => {
        test('returns href if backHref has the same hostname as provided hostname', () => {
            const result = getBackLink({
                backHref: 'https://account.proton.me/asdf',
                hostname: 'account.proton.me',
            });

            expect(result.href).toEqual('https://account.proton.me/asdf');
        });
    });

    describe('to', () => {
        test('returns no empty to if pathname is empty', () => {
            const result = getBackLink({
                backHref: 'https://account.proton.me',
                hostname: 'account.proton.me',
            });

            expect(result.to).toEqual('/');
        });

        test('returns to if backHref has the same hostname as provided hostname', () => {
            const result = getBackLink({
                backHref: 'https://account.proton.me/asdf',
                hostname: 'account.proton.me',
            });

            expect(result.to).toEqual('/asdf');
        });

        test('strips local basename from path', () => {
            const result = getBackLink({
                backHref: 'https://account.proton.me/u/0/asdf',
                hostname: 'account.proton.me',
            });

            expect(result.to).toEqual('/asdf');
        });
    });

    describe('appNameFromHostname', () => {
        test('returns undefined appNameFromHostname for account hostname', () => {
            const result = getBackLink({
                backHref: 'https://account.proton.me',
                hostname: 'account.proton.me',
            });

            expect(result.appNameFromHostname).toEqual(undefined);
        });

        test('returns undefined appNameFromHostname if hostname application is not in ALLOWED_APPS', () => {
            const result = getBackLink({
                backHref: 'https://verify.proton.me',
                hostname: 'verify.proton.me',
            });

            expect(result.appNameFromHostname).toEqual(undefined);
        });

        test('returns correct appNameFromHostname if hostname application is in ALLOWED_APPS', () => {
            const result = getBackLink({
                backHref: 'https://mail.proton.me',
                hostname: 'mail.proton.me',
            });

            expect(result.appNameFromHostname).toEqual('proton-mail');
        });
    });

    describe('appName', () => {
        test('returns undefined appName for account hostname', () => {
            const result = getBackLink({
                backHref: 'https://account.proton.me',
                hostname: 'account.proton.me',
            });

            expect(result.appName).toEqual(undefined);
        });

        test('returns undefined appName if hostname application is not in ALLOWED_APPS', () => {
            const result = getBackLink({
                backHref: 'https://verify.proton.me',
                hostname: 'verify.proton.me',
            });

            expect(result.appName).toEqual(undefined);
        });

        test('returns correct appName if hostname application is in ALLOWED_APPS', () => {
            const result = getBackLink({
                backHref: 'https://mail.proton.me',
                hostname: 'mail.proton.me',
            });

            expect(result.appName).toEqual('proton-mail');
        });

        test('prioritises hostname app over pathname app', () => {
            const result = getBackLink({
                backHref: 'https://mail.proton.me/calendar',
                hostname: 'mail.proton.me',
            });

            expect(result.appName).toEqual('proton-mail');
        });

        test('returns undefined appName if pathname application is not in ALLOWED_APPS', () => {
            const result = getBackLink({
                backHref: 'https://account.proton.me/verify',
                hostname: 'account.proton.me',
            });

            expect(result.appName).toEqual(undefined);
        });

        test('returns correct appName if hostname application is in ALLOWED_APPS', () => {
            const result = getBackLink({
                backHref: 'https://account.proton.me/mail',
                hostname: 'account.proton.me',
            });

            expect(result.appName).toEqual('proton-mail');
        });

        test('returns correct appName if local basename included', () => {
            const result = getBackLink({
                backHref: 'https://account.proton.me/u/0/mail',
                hostname: 'account.proton.me',
            });

            expect(result.appName).toEqual('proton-mail');
        });
    });
});
