import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

import { isCampaignApp } from './isCampaignApp';

describe('isCampaignApp', () => {
    const config = (APP_NAME: string) => ({ APP_NAME }) as unknown as ProtonConfig;

    it.each([APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE])('allows %s', (appName) => {
        expect(isCampaignApp(config(appName), '/')).toBe(true);
    });

    it.each([APPS.PROTONDOCS, APPS.PROTONVPN_SETTINGS, APPS.PROTONPASS])('excludes %s', (appName) => {
        expect(isCampaignApp(config(appName), '/')).toBe(false);
    });

    it.each(['/mail/dashboard', '/calendar/dashboard', '/drive/dashboard'])(
        'allows the account app under %s',
        (pathname) => {
            expect(isCampaignApp(config(APPS.PROTONACCOUNT), pathname)).toBe(true);
        }
    );

    it.each(['/', '/pass/dashboard', '/vpn/dashboard'])('excludes the account app under %s', (pathname) => {
        expect(isCampaignApp(config(APPS.PROTONACCOUNT), pathname)).toBe(false);
    });
});
