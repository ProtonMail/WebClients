import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    multiSubscriptionTestCatalog,
} from '../../testing/buildMultiSubscriptionContext';
import { buildSubscription } from '../../testing/buildSubscription';
import { ADDON_NAMES, PLANS } from '../constants';
import {
    canModifySubscriptions,
    canRunAlongside,
    canSelectB2CLumoPlan,
    isForbiddenForStoreLumoSubscriber,
    shouldReplaceB2CLumoPlanWithAddon,
} from './lumo-purchase-rules';
import { createMultiSubscriptionContext } from './multi-subscription-context';

const ios = { External: SubscriptionPlatform.iOS };
const android = { External: SubscriptionPlatform.Android };

const webMailPlus = buildSubscription(PLANS.MAIL, { Currency: 'USD' });
const webFamily = buildSubscription(PLANS.FAMILY);
const webWorkspace = buildSubscription(PLANS.BUNDLE_PRO_2024);
const webLumoPlus = buildLumoSubscription(PLANS.LUMO, { Currency: 'CHF' });
const webLumoBasic = buildLumoSubscription(PLANS.LUMO_BASIC);
const iosLumoPlus = buildLumoSubscription(PLANS.LUMO, ios);
const iosLumoUltra = buildLumoSubscription(PLANS.LUMO_ULTRA, ios);
const androidMailPlus = buildSubscription(PLANS.MAIL, android);
const webMailPlusWithLumoAddon = buildSubscription({ [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 });
const webUnlimitedWithLumoAddon = buildSubscription({ [PLANS.BUNDLE]: 1, [ADDON_NAMES.LUMO_BUNDLE]: 1 });

describe('canModifySubscriptions', () => {
    it.each([
        ['no subscription', []],
        ['a web subscription', [webMailPlus]],
        ['one store Lumo Plus subscription', [iosLumoPlus]],
        ['one store Lumo Ultra subscription', [iosLumoUltra]],
        ['a store Lumo and a web subscription', [iosLumoPlus, webMailPlus]],
    ])('allows modifications with %s', (_, subscriptions) => {
        expect(canModifySubscriptions({ subscriptions, entitlementCatalog: multiSubscriptionTestCatalog })).toBe(true);
    });

    it.each([
        ['one store Mail Plus subscription', [androidMailPlus]],
        ['two store subscriptions, one of them Lumo', [iosLumoPlus, androidMailPlus]],
    ])('forbids modifications with %s', (_, subscriptions) => {
        expect(canModifySubscriptions({ subscriptions, entitlementCatalog: multiSubscriptionTestCatalog })).toBe(false);
    });
});

describe('createMultiSubscriptionContext', () => {
    it('turns the context on with the flag and the catalog', () => {
        const context = createMultiSubscriptionContext({
            lumoMultiSubscriptions: true,
            subscription: webMailPlus,
            entitlementCatalog: multiSubscriptionTestCatalog,
        });

        expect(context).toEqual({
            lumoMultiSubscriptions: true,
            subscriptions: [webMailPlus],
            entitlementCatalog: multiSubscriptionTestCatalog,
        });
    });

    it('keeps the context off while the catalog is missing', () => {
        const context = createMultiSubscriptionContext({
            lumoMultiSubscriptions: true,
            subscription: webMailPlus,
            entitlementCatalog: undefined,
        });

        expect(context.lumoMultiSubscriptions).toBe(false);
    });
});

describe('canSelectB2CLumoPlan', () => {
    it.each([
        ['a free user', []],
        ['a web Mail Plus subscriber', [webMailPlus]],
        ['a web Lumo Plus subscriber', [webLumoPlus]],
        ['a web Mail Plus and web Lumo Basic subscriber', [webMailPlus, webLumoBasic]],
    ])('allows %s', (_, subscriptions) => {
        expect(canSelectB2CLumoPlan(buildMultiSubscriptionContext(subscriptions))).toBe(true);
    });

    it.each([
        ['a Family subscriber', [webFamily]],
        ['a Workspace Standard subscriber', [webWorkspace]],
        ['a store Lumo Plus subscriber', [iosLumoPlus]],
        ['a store Lumo Plus subscriber with a web subscription', [iosLumoPlus, webMailPlus]],
        ['a store Mail Plus subscriber', [androidMailPlus]],
        ['a Mail Plus subscriber with the Lumo addon', [webMailPlusWithLumoAddon]],
        [
            'an Unlimited subscriber with the Lumo addon next to VPN Plus',
            [webUnlimitedWithLumoAddon, buildSubscription(PLANS.VPN2024)],
        ],
    ])('forbids %s', (_, subscriptions) => {
        expect(canSelectB2CLumoPlan(buildMultiSubscriptionContext(subscriptions))).toBe(false);
    });

    it('forbids everyone with the flag off', () => {
        expect(canSelectB2CLumoPlan(buildMultiSubscriptionContext([webMailPlus], false))).toBe(false);
    });

    it('forbids everyone while the catalog is missing', () => {
        expect(
            canSelectB2CLumoPlan({ ...buildMultiSubscriptionContext([webMailPlus]), entitlementCatalog: undefined })
        ).toBe(false);
    });
});

describe('shouldReplaceB2CLumoPlanWithAddon', () => {
    it.each([PLANS.LUMO_BASIC, PLANS.LUMO, PLANS.LUMO_ULTRA])('replaces %s for a Family subscriber', (planName) => {
        expect(shouldReplaceB2CLumoPlanWithAddon(buildMultiSubscriptionContext([webFamily]), planName)).toBe(true);
    });

    it.each([PLANS.LUMO_BASIC, PLANS.LUMO, PLANS.LUMO_ULTRA])(
        'replaces %s for a Mail Plus subscriber who already has the Lumo addon',
        (planName) => {
            expect(
                shouldReplaceB2CLumoPlanWithAddon(buildMultiSubscriptionContext([webMailPlusWithLumoAddon]), planName)
            ).toBe(true);
        }
    );

    it('keeps Lumo Plus for a Mail Plus subscriber', () => {
        expect(shouldReplaceB2CLumoPlanWithAddon(buildMultiSubscriptionContext([webMailPlus]), PLANS.LUMO)).toBe(false);
    });

    it('never offers the addon to a store Lumo subscriber', () => {
        const context = buildMultiSubscriptionContext([iosLumoPlus, webMailPlus]);

        expect(shouldReplaceB2CLumoPlanWithAddon(context, PLANS.LUMO_ULTRA)).toBe(false);
    });

    it('ignores plans that are not B2C Lumo', () => {
        expect(shouldReplaceB2CLumoPlanWithAddon(buildMultiSubscriptionContext([webFamily]), PLANS.LUMO_BUSINESS)).toBe(
            false
        );
    });
});

describe('canRunAlongside', () => {
    it('lets a B2C Lumo plan run next to non-Lumo subscriptions', () => {
        expect(canRunAlongside(buildMultiSubscriptionContext([webMailPlus]), { [PLANS.LUMO]: 1 })).toBe(true);
    });

    it('lets a single-user plan run next to Lumo subscriptions only', () => {
        expect(canRunAlongside(buildMultiSubscriptionContext([webLumoPlus]), { [PLANS.MAIL]: 1 })).toBe(true);
        expect(canRunAlongside(buildMultiSubscriptionContext([iosLumoPlus]), { [PLANS.MAIL]: 1 })).toBe(true);
        expect(canRunAlongside(buildMultiSubscriptionContext([webMailPlus, webLumoPlus]), { [PLANS.VPN2024]: 1 })).toBe(
            false
        );
    });

    it('lets nothing run next to a plan of the same kind', () => {
        expect(canRunAlongside(buildMultiSubscriptionContext([webLumoPlus]), { [PLANS.LUMO_ULTRA]: 1 })).toBe(false);
        expect(canRunAlongside(buildMultiSubscriptionContext([webMailPlus]), { [PLANS.PASS]: 1 })).toBe(false);
    });

    it('never runs a multi-user plan or a Lumo addon alongside', () => {
        expect(canRunAlongside(buildMultiSubscriptionContext([webLumoPlus]), { [PLANS.DUO]: 1 })).toBe(false);
        expect(
            canRunAlongside(buildMultiSubscriptionContext([webLumoPlus]), {
                [PLANS.MAIL]: 1,
                [ADDON_NAMES.LUMO_MAIL]: 1,
            })
        ).toBe(false);
    });

    it('runs nothing alongside with the flag off', () => {
        expect(canRunAlongside(buildMultiSubscriptionContext([webMailPlus], false), { [PLANS.LUMO]: 1 })).toBe(false);
    });
});

describe('isForbiddenForStoreLumoSubscriber', () => {
    const context = buildMultiSubscriptionContext([iosLumoPlus]);

    it.each([PLANS.MAIL, PLANS.PASS, PLANS.VPN2024, PLANS.DRIVE, PLANS.BUNDLE])('allows %s', (planName) => {
        expect(isForbiddenForStoreLumoSubscriber(context, planName)).toBe(false);
    });

    it.each([PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY, PLANS.PASS_FAMILY, PLANS.BUNDLE_PRO_2024, PLANS.LUMO_BUSINESS])(
        'forbids the multi-user plan %s',
        (planName) => {
            expect(isForbiddenForStoreLumoSubscriber(context, planName)).toBe(true);
        }
    );

    it.each([PLANS.LUMO_BASIC, PLANS.LUMO_ULTRA])('forbids another Lumo tier %s', (planName) => {
        expect(isForbiddenForStoreLumoSubscriber(context, { [planName]: 1 })).toBe(true);
    });

    it('leaves the same Lumo plan to the already-subscribed check', () => {
        expect(isForbiddenForStoreLumoSubscriber(context, { [PLANS.LUMO]: 1 })).toBe(false);
    });

    it('forbids nothing without a store Lumo subscription', () => {
        expect(isForbiddenForStoreLumoSubscriber(buildMultiSubscriptionContext([webLumoPlus]), PLANS.FAMILY)).toBe(
            false
        );
    });
});
