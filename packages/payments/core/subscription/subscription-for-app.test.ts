import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

import { buildEntitlementCatalog } from '../../testing/buildEntitlementCatalog';
import { buildSubscription } from '../../testing/buildSubscription';
import { ADDON_NAMES, PLANS } from '../constants';
import { EntitlementName } from '../entitlements/entitlement-names';
import type { PlanIDs } from '../interface';
import type { Subscription } from './interface';
import { appsByProductFlag, getProductFlagForApp, getSubscriptionForApp } from './subscription-for-app';

const catalogWithProdProductFlags = buildEntitlementCatalog(
    {
        [PLANS.MAIL]: [EntitlementName.FlagsInbox],
        [PLANS.MAIL_PRO]: [EntitlementName.FlagsInbox, EntitlementName.Business],
        [PLANS.VPN2024]: [EntitlementName.FlagsVpn],
        [PLANS.DRIVE]: [EntitlementName.FlagsDrive],
        [PLANS.LUMO]: [EntitlementName.FlagsLumo],
        [PLANS.BUNDLE]: [
            EntitlementName.FlagsInbox,
            EntitlementName.FlagsDrive,
            EntitlementName.FlagsPass,
            EntitlementName.FlagsVpn,
            EntitlementName.FlagsWallet,
        ],
    },
    {
        [ADDON_NAMES.LUMO_MAIL]: [EntitlementName.FlagsLumo],
    }
);

const subscriptionsFor = (...planIDs: (PLANS | PlanIDs)[]): Subscription[] =>
    planIDs.map((plan) => buildSubscription(plan));

const pickSubscription = (subscriptions: Subscription[], appName: APP_NAMES) =>
    getSubscriptionForApp(subscriptions, catalogWithProdProductFlags, appName);

describe('getSubscriptionForApp', () => {
    it.each([APPS.PROTONMAIL, APPS.PROTONDRIVE, APPS.PROTONACCOUNT] as const)(
        'returns the only subscription in %s, whether it covers the app or not',
        (appName) => {
            const subscriptions = subscriptionsFor(PLANS.VPN2024);

            expect(pickSubscription(subscriptions, appName)).toBe(subscriptions[0]);
        }
    );

    it('returns the subscription that covers the app when it is not the first one', () => {
        const [vpn, mail] = subscriptionsFor(PLANS.VPN2024, PLANS.MAIL);

        expect(pickSubscription([vpn, mail], APPS.PROTONMAIL)).toBe(mail);
        expect(pickSubscription([vpn, mail], APPS.PROTONCALENDAR)).toBe(mail);
        expect(pickSubscription([vpn, mail], APPS.PROTONVPN_SETTINGS)).toBe(vpn);
    });

    it('prefers the subscription whose plan covers more products', () => {
        const [mail, bundle] = subscriptionsFor(PLANS.MAIL, PLANS.BUNDLE);

        expect(pickSubscription([mail, bundle], APPS.PROTONMAIL)).toBe(bundle);
    });

    it('keeps list order when two candidates cover as many products', () => {
        const [mail, mailPro] = subscriptionsFor(PLANS.MAIL, PLANS.MAIL_PRO);

        expect(pickSubscription([mail, mailPro], APPS.PROTONMAIL)).toBe(mail);
        expect(pickSubscription([mailPro, mail], APPS.PROTONMAIL)).toBe(mailPro);
    });

    it('returns the first subscription when none covers the app', () => {
        const [mail, vpn] = subscriptionsFor(PLANS.MAIL, PLANS.VPN2024);

        expect(pickSubscription([mail, vpn], APPS.PROTONDRIVE)).toBe(mail);
    });

    it('returns the first subscription in apps without a product', () => {
        const [vpn, bundle] = subscriptionsFor(PLANS.VPN2024, PLANS.BUNDLE);

        expect(pickSubscription([vpn, bundle], APPS.PROTONACCOUNT)).toBe(vpn);
    });

    it('counts a product granted by an addon', () => {
        const [vpn, mailWithLumo] = subscriptionsFor(PLANS.VPN2024, { [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 });

        expect(pickSubscription([vpn, mailWithLumo], APPS.PROTONLUMO)).toBe(mailWithLumo);
    });

    it('returns the first subscription while the catalog is not loaded', () => {
        const [vpn, mail] = subscriptionsFor(PLANS.VPN2024, PLANS.MAIL);

        expect(getSubscriptionForApp([vpn, mail], undefined, APPS.PROTONMAIL)).toBe(vpn);
    });

    it('returns undefined without subscriptions', () => {
        expect(pickSubscription([], APPS.PROTONMAIL)).toBeUndefined();
    });
});

describe('getProductFlagForApp', () => {
    it.each([
        [APPS.PROTONMAIL, EntitlementName.FlagsInbox],
        [APPS.PROTONCALENDAR, EntitlementName.FlagsInbox],
        [APPS.PROTONDRIVE, EntitlementName.FlagsDrive],
        [APPS.PROTONDOCS, EntitlementName.FlagsDrive],
        [APPS.PROTONSHEETS, EntitlementName.FlagsDrive],
        [APPS.PROTONPASS, EntitlementName.FlagsPass],
        [APPS.PROTONVPN_SETTINGS, EntitlementName.FlagsVpn],
        [APPS.PROTONLUMO, EntitlementName.FlagsLumo],
        [APPS.PROTONMEET, EntitlementName.FlagsMeet],
        [APPS.PROTONWALLET, EntitlementName.FlagsWallet],
        [APPS.PROTONACCOUNT, undefined],
        [APPS.PROTONCONTACTS, undefined],
    ] as const)('maps %s to %s', (appName, productFlag) => {
        expect(getProductFlagForApp(appName)).toBe(productFlag);
    });

    it('maps every app to at most one product', () => {
        const mappedApps = Object.values(appsByProductFlag).flat();

        expect(new Set(mappedApps).size).toBe(mappedApps.length);
    });
});
