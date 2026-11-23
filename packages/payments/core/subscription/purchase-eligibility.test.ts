import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '../../testing/buildMultiSubscriptionContext';
import { buildSubscription } from '../../testing/buildSubscription';
import { FREE_SUBSCRIPTION, PLANS } from '../constants';
import type { PlanIDs } from '../interface';
import type { Subscription } from './interface';
import { toSubscriptionList } from './multi-subscription-context';
import {
    canModify,
    canStartPurchase,
    getAvailableSubscriptionActions,
    getChangedSubscription,
    getPurchaseOutcome,
    getSubscriptionChangedByPlan,
} from './purchase-eligibility';

const webMailPlus = buildSubscription(PLANS.MAIL);
const webLumoPlus = buildLumoSubscription(PLANS.LUMO);
const iosLumoPlus = buildLumoSubscription(PLANS.LUMO, { External: SubscriptionPlatform.iOS });

const getOutcome = (subscriptions: Subscription[], planName: PLANS) =>
    getPurchaseOutcome(buildMultiSubscriptionContext(subscriptions), { [planName]: 1 });

describe('getPurchaseOutcome', () => {
    it('creates a new subscription for a user without one', () => {
        expect(getOutcome([], PLANS.MAIL)).toEqual({ type: 'new-subscription' });
    });

    it('creates a new subscription for a plan that can run alongside', () => {
        expect(getOutcome([webMailPlus], PLANS.LUMO)).toEqual({ type: 'new-subscription' });
        expect(getOutcome([webLumoPlus], PLANS.MAIL)).toEqual({ type: 'new-subscription' });
        expect(getOutcome([iosLumoPlus], PLANS.MAIL)).toEqual({ type: 'new-subscription' });
    });

    it('replaces the subscription that grants a product of the new plan', () => {
        expect(getOutcome([webLumoPlus], PLANS.LUMO_ULTRA)).toEqual({ type: 'replaces', subscription: webLumoPlus });
        expect(getOutcome([webMailPlus, webLumoPlus], PLANS.LUMO_ULTRA)).toEqual({
            type: 'replaces',
            subscription: webLumoPlus,
        });
        expect(getOutcome([webMailPlus, webLumoPlus], PLANS.BUNDLE)).toEqual({
            type: 'replaces',
            subscription: webMailPlus,
        });
    });

    it('replaces the only web subscription with a plan of another product', () => {
        expect(getOutcome([webMailPlus], PLANS.PASS)).toEqual({ type: 'replaces', subscription: webMailPlus });
        expect(getOutcome([webMailPlus], PLANS.DUO)).toEqual({ type: 'replaces', subscription: webMailPlus });
    });

    describe('with LumoMultiSubscriptions off', () => {
        const getOutcomeFlagOff = (subscriptions: Subscription[], planName: PLANS) =>
            getPurchaseOutcome(buildMultiSubscriptionContext(subscriptions, false), { [planName]: 1 });

        it('replaces the web subscription next to a mobile one', () => {
            [PLANS.MAIL, PLANS.BUNDLE, PLANS.PASS].forEach((planName) => {
                expect(getOutcomeFlagOff([webMailPlus, iosLumoPlus], planName)).toEqual({
                    type: 'replaces',
                    subscription: webMailPlus,
                });
            });
        });

        it('refuses a purchase next to two web subscriptions', () => {
            expect(getOutcomeFlagOff([webMailPlus, webLumoPlus], PLANS.MAIL)).toEqual({ type: 'refused' });
        });

        it('refuses a purchase when the only subscription is mobile', () => {
            expect(getOutcomeFlagOff([iosLumoPlus], PLANS.MAIL)).toEqual({ type: 'refused' });
        });
    });

    it('refuses a plan of another product next to several subscriptions', () => {
        expect(getOutcome([webMailPlus, webLumoPlus], PLANS.VPN2024)).toEqual({ type: 'refused' });
    });

    it('refuses a plan that is not allowed next to the subscriptions it leaves running', () => {
        expect(getOutcome([webMailPlus, webLumoPlus], PLANS.DUO)).toEqual({ type: 'refused' });
    });

    it('refuses to replace a store subscription', () => {
        expect(getOutcome([iosLumoPlus], PLANS.LUMO_ULTRA)).toEqual({ type: 'refused' });
    });
});

describe('getChangedSubscription', () => {
    const getChanged = (subscriptions: Subscription[], planIDs: PlanIDs, lumoMultiSubscriptions = true) =>
        getChangedSubscription(buildMultiSubscriptionContext(subscriptions, lumoMultiSubscriptions), planIDs);

    it('finds the subscription each selection changes when there are two', () => {
        const subscriptions = [webMailPlus, webLumoPlus];

        expect(getChanged(subscriptions, { [PLANS.LUMO]: 1 })).toBe(webLumoPlus);
        expect(getChanged(subscriptions, { [PLANS.LUMO_ULTRA]: 1 })).toBe(webLumoPlus);
        expect(getChanged(subscriptions, { [PLANS.MAIL]: 1 })).toBe(webMailPlus);
        expect(getChanged(subscriptions, { [PLANS.BUNDLE]: 1 })).toBe(webMailPlus);
    });

    it('returns the only web subscription for every selection that replaces it', () => {
        expect(getChanged([webMailPlus], { [PLANS.MAIL]: 1 })).toBe(webMailPlus);
        expect(getChanged([webMailPlus], { [PLANS.PASS]: 1 })).toBe(webMailPlus);
        expect(getChanged([webMailPlus], { [PLANS.LUMO]: 1 }, false)).toBe(webMailPlus);
    });

    it('returns the only web subscription next to a mobile one when the flag is off', () => {
        const subscriptions = [webMailPlus, iosLumoPlus];

        expect(getChanged(subscriptions, { [PLANS.MAIL]: 1 }, false)).toBe(webMailPlus);
        expect(getChanged(subscriptions, { [PLANS.BUNDLE]: 1 }, false)).toBe(webMailPlus);
        expect(getChanged(subscriptions, { [PLANS.DRIVE]: 1 }, false)).toBe(webMailPlus);
        expect(getChanged(subscriptions, { [PLANS.PASS]: 1 }, false)).toBe(webMailPlus);
    });

    it('returns nothing for a user with only mobile subscriptions when the flag is off', () => {
        expect(getChanged([iosLumoPlus], { [PLANS.MAIL]: 1 }, false)).toBeUndefined();
    });

    it('returns nothing for a new subscription next to the existing ones', () => {
        expect(getChanged([], { [PLANS.MAIL]: 1 })).toBeUndefined();
        expect(getChanged([webMailPlus], { [PLANS.LUMO]: 1 })).toBeUndefined();
    });

    it('returns nothing for a refused purchase', () => {
        expect(getChanged([webMailPlus, webLumoPlus], { [PLANS.VPN2024]: 1 })).toBeUndefined();
        expect(getChanged([iosLumoPlus], { [PLANS.LUMO_ULTRA]: 1 })).toBeUndefined();
    });
});

describe('getSubscriptionChangedByPlan', () => {
    it('finds the subscription that buying the plan alone changes', () => {
        const context = buildMultiSubscriptionContext([webMailPlus, webLumoPlus]);

        expect(getSubscriptionChangedByPlan(context, PLANS.LUMO)).toBe(webLumoPlus);
        expect(getSubscriptionChangedByPlan(context, PLANS.BUNDLE)).toBe(webMailPlus);
        expect(getSubscriptionChangedByPlan(context, PLANS.VPN2024)).toBeUndefined();
        expect(getSubscriptionChangedByPlan(buildMultiSubscriptionContext([webMailPlus]), PLANS.LUMO)).toBeUndefined();
    });
});

describe('canModify', () => {
    it('returns true when subscription is null', () => {
        expect(canModify(buildMultiSubscriptionContextFromSubscription(null as any))).toBe(true);
    });

    it('returns true when subscription is undefined', () => {
        expect(canModify(buildMultiSubscriptionContextFromSubscription(undefined as any))).toBe(true);
    });

    it('returns true for free subscription', () => {
        expect(canModify(buildMultiSubscriptionContextFromSubscription(FREE_SUBSCRIPTION as any))).toBe(true);
    });

    it('returns false for externally managed subscription without Lumo', () => {
        const subscription = buildSubscription(undefined, {
            External: SubscriptionPlatform.Android,
        });
        expect(canModify(buildMultiSubscriptionContextFromSubscription(subscription))).toBe(false);
    });

    it('returns true for non-externally managed subscription', () => {
        const subscription = buildSubscription(undefined, {
            External: SubscriptionPlatform.Default,
        });
        expect(canModify(buildMultiSubscriptionContextFromSubscription(subscription))).toBe(true);
    });

    it('looks at every subscription, whichever comes first', () => {
        const storeMailPlus = buildSubscription(PLANS.MAIL, { External: SubscriptionPlatform.Android });
        const webPassPlus = buildSubscription(PLANS.PASS, { External: SubscriptionPlatform.Default });
        const storeLumoPlus = buildSubscription(PLANS.LUMO, { External: SubscriptionPlatform.iOS });

        expect(canModify(buildMultiSubscriptionContext([storeMailPlus, webPassPlus], false))).toBe(true);
        expect(canModify(buildMultiSubscriptionContext([storeMailPlus, storeLumoPlus], false))).toBe(false);
        expect(canModify(buildMultiSubscriptionContext([storeMailPlus], false))).toBe(false);
    });

    it('returns true for externally managed subscription with Lumo', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.Android,
        });

        expect(canModify(buildMultiSubscriptionContextFromSubscription(subscription))).toBe(true);
    });
});

describe('canModify with the Lumo purchase rules', () => {
    const withFlagOn = (subscription?: Subscription) => buildMultiSubscriptionContext(toSubscriptionList(subscription));

    it('lets a store Lumo Ultra subscriber add a subscription only with the flag on', () => {
        const subscription = buildLumoSubscription(PLANS.LUMO_ULTRA, { External: SubscriptionPlatform.iOS });

        expect(canModify(buildMultiSubscriptionContextFromSubscription(subscription))).toBe(false);
        expect(canModify(withFlagOn(subscription))).toBe(true);
    });

    it('locks a user whose two subscriptions are both store-managed', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.iOS,
            SecondarySubscriptions: [buildSubscription(PLANS.MAIL, { External: SubscriptionPlatform.Android })],
        });

        expect(canModify(buildMultiSubscriptionContextFromSubscription(subscription))).toBe(false);
        expect(canModify(withFlagOn(subscription))).toBe(false);
    });

    it('keeps a store Mail Plus subscriber locked with the flag on', () => {
        const subscription = buildSubscription(PLANS.MAIL, { External: SubscriptionPlatform.Android });

        expect(canModify(withFlagOn(subscription))).toBe(false);
    });

    it('keeps a store Lumo Ultra subscriber locked while the catalog is missing', () => {
        const subscription = buildLumoSubscription(PLANS.LUMO_ULTRA, { External: SubscriptionPlatform.iOS });

        expect(canModify({ ...withFlagOn(subscription), entitlementCatalog: undefined })).toBe(false);
    });

    it('lets a free user modify with the flag on', () => {
        expect(canModify(withFlagOn())).toBe(true);
    });
});

describe('canStartPurchase', () => {
    const storeMailPlus = buildSubscription(PLANS.MAIL, { External: SubscriptionPlatform.iOS });
    const withFlagOn = buildMultiSubscriptionContext(toSubscriptionList(storeMailPlus));

    it('lets a store Mail Plus subscriber start buying a Lumo tier with the flag on', () => {
        expect(canStartPurchase(withFlagOn, PLANS.LUMO_BASIC)).toBe(true);
        expect(canStartPurchase(withFlagOn, PLANS.LUMO)).toBe(true);
        expect(canStartPurchase(withFlagOn, PLANS.LUMO_ULTRA)).toBe(true);
    });

    it('keeps a store Mail Plus subscriber away from every other plan', () => {
        expect(canStartPurchase(withFlagOn, PLANS.MAIL)).toBe(false);
        expect(canStartPurchase(withFlagOn, PLANS.BUNDLE)).toBe(false);
        expect(canStartPurchase(withFlagOn, PLANS.DUO)).toBe(false);
        expect(canStartPurchase(withFlagOn, undefined)).toBe(false);
    });

    it('keeps a store Mail Plus subscriber away from Lumo tiers with the flag off', () => {
        expect(canStartPurchase(buildMultiSubscriptionContextFromSubscription(storeMailPlus), PLANS.LUMO_BASIC)).toBe(
            false
        );
    });

    it('keeps a user with a store Lumo subscription next to a store Mail Plus away from other Lumo tiers', () => {
        const subscription = buildLumoSubscription(PLANS.LUMO_BASIC, {
            External: SubscriptionPlatform.iOS,
            SecondarySubscriptions: [storeMailPlus],
        });

        expect(
            canStartPurchase(buildMultiSubscriptionContext(toSubscriptionList(subscription)), PLANS.LUMO_ULTRA)
        ).toBe(false);
    });

    it('lets a web subscriber start any purchase', () => {
        const context = buildMultiSubscriptionContext(toSubscriptionList(buildSubscription(PLANS.MAIL)));

        expect(canStartPurchase(context, PLANS.BUNDLE)).toBe(true);
        expect(canStartPurchase(context, undefined)).toBe(true);
    });
});

describe('getAvailableActions', () => {
    it('lets a web subscriber modify', () => {
        const subscription = buildSubscription(undefined, {
            External: SubscriptionPlatform.Default,
        });

        const result = getAvailableSubscriptionActions(buildMultiSubscriptionContextFromSubscription(subscription));

        expect(result).toEqual({
            canModify: true,
            cantModifyReason: undefined,
        });
    });

    it('locks an externally managed subscriber without Lumo', () => {
        const subscription = buildSubscription(undefined, {
            External: SubscriptionPlatform.Android,
        });

        const result = getAvailableSubscriptionActions(buildMultiSubscriptionContextFromSubscription(subscription));

        expect(result).toEqual({
            canModify: false,
            cantModifyReason: 'subscription_managed_externally',
        });
    });

    it('lets an externally managed Lumo subscriber modify', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.Android,
        });

        const result = getAvailableSubscriptionActions(buildMultiSubscriptionContextFromSubscription(subscription));

        expect(result).toEqual({
            canModify: true,
            cantModifyReason: undefined,
        });
    });
});
