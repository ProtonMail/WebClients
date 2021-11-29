import { getAppVersionHeaders } from '../../lib/fetch/headers';
import { getClientID } from '../../lib/apps/helper';
import { APP_NAMES, APPS } from '../../lib/constants';

describe('app version headers', () => {
    it('should return new app headers', () => {
        const test = (app: APP_NAMES, version: string, expectation: string) => {
            expect(getAppVersionHeaders(getClientID(app), version)).toEqual({ 'x-pm-appversion': expectation });
        };

        for (const { app, version, expectation } of [
            {
                app: APPS.PROTONMAIL,
                version: '4.999.999',
                expectation: 'web-mail@4.999.999',
            },
            {
                app: APPS.PROTONMAIL,
                version: '4.14.6',
                expectation: 'web-mail@4.14.6',
            },
            {
                app: APPS.PROTONCALENDAR,
                version: '4.0.1',
                expectation: 'web-calendar@4.0.1',
            },
            {
                app: APPS.PROTONVPN_SETTINGS,
                version: '4.999.999',
                expectation: 'web-vpn-settings@4.999.999',
            },
            {
                app: APPS.PROTONVERIFICATION,
                version: '4.1.0',
                expectation: 'web-verify@4.1.0',
            },
            {
                app: APPS.PROTONADMIN,
                version: '4.12.12',
                expectation: 'web-admin@4.12.12',
            },
        ]) {
            test(app, version, expectation);
        }
    });
});
