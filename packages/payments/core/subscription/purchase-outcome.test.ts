import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import { buildLumoSubscription, buildMultiSubscriptionContext } from '../../testing/buildMultiSubscriptionContext';
import { buildSubscription } from '../../testing/buildSubscription';
import { PLANS } from '../constants';
import type { PlanIDs } from '../interface';
import type { Subscription } from './interface';
import { getChangedSubscription, getPurchaseOutcome, getSubscriptionChangedByPlan } from './purchase-outcome';

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
