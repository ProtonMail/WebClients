import { APPS, APP_UPSELL_REF_PATH, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '../../lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef, getUpsellRefFromApp } from '../../lib/helpers/upsell';
import type { UserModel } from '../../lib/interfaces';
import { PLANS, PLAN_TYPES } from '../../lib/payments/constants';
import type { Subscription } from '../../lib/payments/subscription/interface';

const feature = SHARED_UPSELL_PATHS.STORAGE;

describe('addUpsellPath', () => {
    it('should add the upsell path to the link', () => {
        const link = '/myLink';
        const upsellPath = 'myUpsellPath';

        const expected = `${link}?ref=${upsellPath}`;
        expect(addUpsellPath(link, upsellPath)).toEqual(expected);
    });

    it('should add the upsell path in a new param to the link', function () {
        const link = '/myLink?something=1';
        const upsellPath = 'myUpsellPath';

        const expected = `${link}&ref=${upsellPath}`;
        expect(addUpsellPath(link, upsellPath)).toEqual(expected);
    });

    it('should not add anything to the link', () => {
        const link = '/myLink';
        expect(addUpsellPath(link, undefined)).toEqual(link);
    });
});

describe('getUpsellRef', () => {
    it('should generate expected upsell ref with app and feature', () => {
        expect(getUpsellRef({ app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH, feature })).toEqual(
            `${APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}${feature}`
        );
    });

    it('should generate expected upsell ref with app, feature and component', () => {
        expect(
            getUpsellRef({ app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH, component: UPSELL_COMPONENT.BANNER, feature })
        ).toEqual(`${APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}${UPSELL_COMPONENT.BANNER}${feature}`);
    });

    it('should generate expected upsell ref with app, feature and settings', () => {
        expect(getUpsellRef({ app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH, feature, isSettings: true })).toEqual(
            `${APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}${feature}_settings`
        );
    });

    it('should generate expected upsell ref with app, feature, component and settings', () => {
        expect(
            getUpsellRef({
                app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
                component: UPSELL_COMPONENT.BANNER,
                feature,
                isSettings: true,
            })
        ).toEqual(`${APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}${UPSELL_COMPONENT.BANNER}${feature}_settings`);
    });
});

describe('getUpsellRefFromApp', () => {
    it('should generate the expected upsell ref', () => {
        // Open from mail
        expect(getUpsellRefFromApp({ app: APPS.PROTONMAIL, feature })).toEqual(
            `${APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}${feature}`
        );
        // Open from calendar
        expect(getUpsellRefFromApp({ app: APPS.PROTONCALENDAR, feature })).toEqual(
            `${APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH}${feature}`
        );
        // Open from drive
        expect(getUpsellRefFromApp({ app: APPS.PROTONDRIVE, feature })).toEqual(
            `${APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH}${feature}`
        );
        // Open from mail settings
        expect(getUpsellRefFromApp({ app: APPS.PROTONACCOUNT, feature, fromApp: APPS.PROTONMAIL })).toEqual(
            `${APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}${feature}_settings`
        );
        // Open from calendar settings
        expect(getUpsellRefFromApp({ app: APPS.PROTONACCOUNT, feature, fromApp: APPS.PROTONCALENDAR })).toEqual(
            `${APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH}${feature}_settings`
        );
        // Open from drive settings
        expect(getUpsellRefFromApp({ app: APPS.PROTONACCOUNT, feature, fromApp: APPS.PROTONDRIVE })).toEqual(
            `${APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH}${feature}_settings`
        );
        // Open from vpn settings
        expect(getUpsellRefFromApp({ app: APPS.PROTONACCOUNT, feature, fromApp: APPS.PROTONVPN_SETTINGS })).toEqual(
            `${APP_UPSELL_REF_PATH.VPN_UPSELL_REF_PATH}${feature}_settings`
        );
    });
});

describe('getUpgradePath', () => {
    const paidUser = { isFree: false } as UserModel;

    const subscriptionWith = (planName: string) =>
        ({ Plans: [{ Name: planName, Type: PLAN_TYPES.PLAN }] }) as unknown as Subscription;

    it('should fall back to the current plan when no plan is given', () => {
        expect(getUpgradePath({ user: paidUser, subscription: subscriptionWith(PLANS.MAIL) })).toEqual(
            `/dashboard?plan=${PLANS.MAIL}&target=compare`
        );
    });

    it('should replace the deprecated VPN plan of the current subscription', () => {
        expect(getUpgradePath({ user: paidUser, subscription: subscriptionWith(PLANS.VPN) })).toEqual(
            `/dashboard?plan=${PLANS.VPN2024}&target=compare`
        );
    });

    it('should keep an explicitly requested plan', () => {
        expect(
            getUpgradePath({ user: paidUser, subscription: subscriptionWith(PLANS.VPN), plan: PLANS.BUNDLE })
        ).toEqual(`/dashboard?plan=${PLANS.BUNDLE}&target=compare`);
    });

    it('should fall back to the bundle plan when the subscription has no plan', () => {
        expect(getUpgradePath({ user: paidUser, subscription: undefined })).toEqual(
            `/dashboard?plan=${PLANS.BUNDLE}&target=compare`
        );
    });
});
