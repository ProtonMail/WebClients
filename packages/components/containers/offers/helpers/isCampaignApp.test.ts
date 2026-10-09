import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

import { getCampaignScope, isCampaignApp } from './isCampaignApp';

describe('isCampaignApp', () => {
    const config = (APP_NAME: string) => ({ APP_NAME }) as unknown as ProtonConfig;

    it.each([APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE])('allows %s', (appName) => {
        expect(isCampaignApp(config(appName), '/')).toBe(true);
    });

    it.each([APPS.PROTONDOCS, APPS.PROTONVPN_SETTINGS, APPS.PROTONPASS])('excludes %s', (appName) => {
        expect(isCampaignApp(config(appName), '/')).toBe(false);
    });

    it.each(['/mail/dashboard', '/calendar/dashboard', '/drive/dashboard', '/pass/dashboard'])(
        'allows the account app under %s',
        (pathname) => {
            expect(isCampaignApp(config(APPS.PROTONACCOUNT), pathname)).toBe(true);
        }
    );

    it.each(['/', '/vpn/dashboard', '/docs/dashboard'])('excludes the account app under %s', (pathname) => {
        expect(isCampaignApp(config(APPS.PROTONACCOUNT), pathname)).toBe(false);
    });
});

describe('getCampaignScope', () => {
    const config = (APP_NAME: string) => ({ APP_NAME }) as unknown as ProtonConfig;

    it.each([
        [APPS.PROTONMAIL, '/', 'inbox'],
        [APPS.PROTONCALENDAR, '/', 'inbox'],
        [APPS.PROTONDRIVE, '/', 'drive'],
        [APPS.PROTONACCOUNT, '/mail/dashboard', 'inbox'],
        [APPS.PROTONACCOUNT, '/calendar/dashboard', 'inbox'],
        [APPS.PROTONACCOUNT, '/drive/dashboard', 'drive'],
        [APPS.PROTONACCOUNT, '/pass/dashboard', 'pass'],
    ])('puts %s under %s in the %s scope', (appName, pathname, scope) => {
        expect(getCampaignScope(config(appName), pathname)).toBe(scope);
    });

    it.each([
        [APPS.PROTONPASS, '/'],
        [APPS.PROTONDOCS, '/'],
        [APPS.PROTONACCOUNT, '/'],
        [APPS.PROTONACCOUNT, '/vpn/dashboard'],
    ])('gives %s under %s no scope', (appName, pathname) => {
        expect(getCampaignScope(config(appName), pathname)).toBeUndefined();
    });
});
