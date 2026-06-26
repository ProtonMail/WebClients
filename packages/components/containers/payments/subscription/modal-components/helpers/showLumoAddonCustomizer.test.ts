import { ADDON_NAMES, FREE_SUBSCRIPTION, PLANS, SubscriptionPlatform } from '@proton/payments/index';
import { buildSubscription } from '@proton/testing/builders/subscription';

import { showLumoAddonCustomizer } from './showLumoAddonCustomizer';

describe('showLumoAddonCustomizer', () => {
    describe('externally managed lumo subscription', () => {
        it('should return false if current subscription is an externally managed lumo subscription', () => {
            const subscription = buildSubscription(PLANS.LUMO, {
                External: SubscriptionPlatform.Android,
            });

            expect(
                showLumoAddonCustomizer({
                    subscription,
                    couponConfig: undefined,
                    planIDs: {
                        [PLANS.MAIL]: 1,
                    },
                })
            ).toBe(false);
        });

        it('should return false if any secondary subscription is an externally managed lumo subscription', () => {
            const subscription = buildSubscription(PLANS.BUNDLE, {
                SecondarySubscriptions: [buildSubscription(PLANS.LUMO, { External: SubscriptionPlatform.Android })],
            });

            expect(
                showLumoAddonCustomizer({
                    subscription,
                    couponConfig: undefined,
                    planIDs: {
                        [PLANS.MAIL]: 1,
                    },
                })
            ).toBe(false);
        });

        it('should return true if current subscription is not an externally managed lumo subscription', () => {
            const subscription = buildSubscription(PLANS.MAIL, {
                External: SubscriptionPlatform.Default,
            });

            expect(
                showLumoAddonCustomizer({
                    subscription,
                    couponConfig: undefined,
                    planIDs: {
                        [PLANS.BUNDLE]: 1,
                    },
                })
            ).toBe(true);
        });
    });

    describe('selected plan support for lumo addon', () => {
        it('should return false if selected plan does not support lumo addon', () => {
            expect(
                showLumoAddonCustomizer({
                    subscription: FREE_SUBSCRIPTION,
                    couponConfig: undefined,
                    planIDs: {
                        [PLANS.LUMO]: 1,
                    },
                })
            ).toBe(false);
        });

        it('should return false if no plan is selected', () => {
            expect(
                showLumoAddonCustomizer({
                    subscription: FREE_SUBSCRIPTION,
                    couponConfig: undefined,
                    planIDs: {},
                })
            ).toBe(false);
        });

        it('should return true if a non-externally-managed lumo secondary subscription exists', () => {
            const subscription = buildSubscription(PLANS.BUNDLE, {
                SecondarySubscriptions: [buildSubscription(PLANS.LUMO, { External: SubscriptionPlatform.Default })],
            });

            expect(
                showLumoAddonCustomizer({
                    subscription,
                    couponConfig: undefined,
                    planIDs: {
                        [PLANS.MAIL]: 1,
                    },
                })
            ).toBe(true);
        });
    });

    describe('Custom overrides', () => {
        it('should hide lumo addon customizer if hideLumoAddonBanner is true', () => {
            expect(
                showLumoAddonCustomizer({
                    subscription: FREE_SUBSCRIPTION,
                    couponConfig: { hideLumoAddonBanner: true, coupons: [], hidden: false },
                    planIDs: {
                        [PLANS.MAIL]: 1,
                    },
                })
            ).toBe(false);
        });

        it('should display lumo addon banner if it is already specified in planIDs', () => {
            expect(
                showLumoAddonCustomizer({
                    subscription: FREE_SUBSCRIPTION,
                    couponConfig: undefined,
                    planIDs: {
                        [PLANS.MAIL]: 1,
                        [ADDON_NAMES.LUMO_MAIL]: 1,
                    },
                })
            ).toBe(true);
        });

        it('should display lumo addon banner even if hideLumoAddonBanner is true when the addon is already in planIDs', () => {
            expect(
                showLumoAddonCustomizer({
                    subscription: FREE_SUBSCRIPTION,
                    couponConfig: { hideLumoAddonBanner: true, coupons: [], hidden: false },
                    planIDs: {
                        [PLANS.MAIL]: 1,
                        [ADDON_NAMES.LUMO_MAIL]: 1,
                    },
                })
            ).toBe(true);
        });
    });
});
