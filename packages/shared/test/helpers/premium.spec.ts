import {
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import { getPremium } from '@proton/shared/lib/helpers/premium';

describe('getPremium', () => {
    it('returns expected string when passed one app', () => {
        expect(getPremium(VPN_APP_NAME)).toEqual('Premium Proton VPN');
    });

    it('returns expected string when passed one app', () => {
        expect(getPremium(MAIL_SHORT_APP_NAME, CALENDAR_SHORT_APP_NAME)).toEqual('Premium Mail & Calendar');
    });

    it('returns expected string when passed one app', () => {
        expect(getPremium(MAIL_SHORT_APP_NAME, CALENDAR_SHORT_APP_NAME, DRIVE_SHORT_APP_NAME)).toEqual(
            'Premium Mail & Calendar & Drive'
        );
    });
});
