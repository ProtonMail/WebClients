import { APPS, APP_UPSELL_REF_PATH, SHARED_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpsellAppRef } from '@proton/shared/lib/helpers/upsell';

describe('addUpsellPath', () => {
    it('should add the upsell path to the link', () => {
        const link = 'myLink';
        const upsellPath = 'myUpsellPath';

        const expected = `${link}?ref=${upsellPath}`;
        expect(addUpsellPath(link, upsellPath)).toEqual(expected);
    });

    it('should add the upsell path in a new param to the link', function () {
        const link = 'myLink?something=1';
        const upsellPath = 'myUpsellPath';

        const expected = `${link}&ref=${upsellPath}`;
        expect(addUpsellPath(link, upsellPath)).toEqual(expected);
    });

    it('should not add anything to the link', () => {
        const link = 'myLink';
        expect(addUpsellPath(link, undefined)).toEqual(link);
    });
});

describe('getUpsellAppRef', () => {
    it('should generate the expected upsell ref', () => {
        const feature = SHARED_UPSELL_PATHS.STORAGE;

        // Open from mail
        expect(getUpsellAppRef(APPS.PROTONMAIL, feature)).toEqual(
            `${APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}${feature}`
        );
        // Open from calendar
        expect(getUpsellAppRef(APPS.PROTONCALENDAR, feature)).toEqual(
            `${APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH}${feature}`
        );
        // Open from drive
        expect(getUpsellAppRef(APPS.PROTONDRIVE, feature)).toEqual(
            `${APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH}${feature}`
        );
        // Open from mail settings
        expect(getUpsellAppRef(APPS.PROTONACCOUNT, feature, APPS.PROTONMAIL)).toEqual(
            `${APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}${feature}_settings`
        );
        // Open from calendar settings
        expect(getUpsellAppRef(APPS.PROTONACCOUNT, feature, APPS.PROTONCALENDAR)).toEqual(
            `${APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH}${feature}_settings`
        );
        // Open from drive settings
        expect(getUpsellAppRef(APPS.PROTONACCOUNT, feature, APPS.PROTONDRIVE)).toEqual(
            `${APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH}${feature}_settings`
        );
        // Open from vpn settings
        expect(getUpsellAppRef(APPS.PROTONACCOUNT, feature, APPS.PROTONVPN_SETTINGS)).toEqual(
            `${APP_UPSELL_REF_PATH.VPN_UPSELL_REF_PATH}${feature}_settings`
        );
    });
});
