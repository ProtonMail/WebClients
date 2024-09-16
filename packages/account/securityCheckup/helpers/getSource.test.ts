import { APPS } from '@proton/shared/lib/constants';

import getSource from './getSource';

describe('getSource', () => {
    test('returns undefined for empty pathname', () => {
        const result = getSource({ pathname: '', search: new URLSearchParams() });
        expect(result).toBe(undefined);
    });

    test('returns undefined for empty search params', () => {
        const result = getSource({ pathname: '', search: new URLSearchParams() });
        expect(result).toBe(undefined);
    });

    describe('email source', () => {
        test(`returns 'email_danger' source if path is 'safety-review/source/email-danger'`, () => {
            const pathname = '/u/0/safety-review/source/email-danger';

            const result = getSource({ pathname, search: new URLSearchParams() });

            expect(result).toBe('email_danger');
        });

        test(`returns 'email_warning' source if path is 'safety-review/source/email-warning'`, () => {
            const pathname = '/u/0/safety-review/source/email-warning';

            const result = getSource({ pathname, search: new URLSearchParams() });

            expect(result).toBe('email_warning');
        });

        test(`returns 'email_info' source if path is 'safety-review/source/email-info'`, () => {
            const pathname = '/u/0/safety-review/source/email-info';

            const result = getSource({ pathname, search: new URLSearchParams() });

            expect(result).toBe('email_info');
        });
    });

    describe('dropdown source', () => {
        test(`returns 'user_dropdown_account' source if source query param is 'user_dropdown' and appname is 'proton-account'`, () => {
            const pathname = '/u/0/safety-review';
            const search = new URLSearchParams({ source: 'user_dropdown', appname: APPS.PROTONACCOUNT });

            const result = getSource({ pathname, search });

            expect(result).toBe('user_dropdown_account');
        });

        test(`returns 'user_dropdown_vpn_settings' source if source query param is 'user_dropdown' and appname is 'proton-vpn-settings'`, () => {
            const pathname = '/u/0/safety-review';
            const search = new URLSearchParams({ source: 'user_dropdown', appname: APPS.PROTONVPN_SETTINGS });

            const result = getSource({ pathname, search });

            expect(result).toBe('user_dropdown_vpn_settings');
        });

        test(`returns 'user_dropdown_mail' source if source query param is 'user_dropdown' and appname is 'proton-mail'`, () => {
            const pathname = '/u/0/safety-review';
            const search = new URLSearchParams({ source: 'user_dropdown', appname: APPS.PROTONMAIL });

            const result = getSource({ pathname, search });

            expect(result).toBe('user_dropdown_mail');
        });

        test(`returns 'user_dropdown_calendar' source if source query param is 'user_dropdown' and appname is 'proton-calendar'`, () => {
            const pathname = '/u/0/safety-review';
            const search = new URLSearchParams({ source: 'user_dropdown', appname: APPS.PROTONCALENDAR });

            const result = getSource({ pathname, search });

            expect(result).toBe('user_dropdown_calendar');
        });

        test(`returns 'user_dropdown_drive' source if source query param is 'user_dropdown' and appname is 'proton-drive'`, () => {
            const pathname = '/u/0/safety-review';
            const search = new URLSearchParams({ source: 'user_dropdown', appname: APPS.PROTONDRIVE });

            const result = getSource({ pathname, search });

            expect(result).toBe('user_dropdown_drive');
        });

        test(`returns 'user_dropdown_docs' source if source query param is 'user_dropdown' and appname is 'proton-docs'`, () => {
            const pathname = '/u/0/safety-review';
            const search = new URLSearchParams({ source: 'user_dropdown', appname: APPS.PROTONDOCS });

            const result = getSource({ pathname, search });

            expect(result).toBe('user_dropdown_docs');
        });
    });

    describe('recovery settings', () => {
        test(`returns 'recovery_settings' source if source query param is 'recovery_settings'`, () => {
            const pathname = '/u/0/safety-review';
            const search = new URLSearchParams('?source=recovery_settings');

            const result = getSource({ pathname, search });

            expect(result).toBe('recovery_settings');
        });
    });
});
