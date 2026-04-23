import {
    ADDON_NAMES,
    COUPON_CODES,
    CYCLE,
    FREE_SUBSCRIPTION,
    PLANS,
    SubscriptionPlatform,
} from '@proton/payments/index';
import { buildSubscription } from '@proton/testing/builders';

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
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.MAIL]: 1,
                    },
                    cycle: CYCLE.YEARLY,
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
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.MAIL]: 1,
                    },
                    cycle: CYCLE.YEARLY,
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
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.BUNDLE]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                })
            ).toBe(true);
        });
    });

    describe('Experiment: Conditionally hide lumo addon customizer for those who subscribes to vpn2024', () => {
        it('should return false if flag is enabled, user is free and selects vpn2024', () => {
            expect(
                showLumoAddonCustomizer({
                    subscription: FREE_SUBSCRIPTION,
                    couponConfig: undefined,
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.VPN2024]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                    hideLumoAddonForVpn2024: true,
                })
            ).toBe(false);
        });

        it('should return false if flag is enabled, user has vpn2024 subscription and selects vpn2024', () => {
            const subscription = buildSubscription(PLANS.VPN2024);

            expect(
                showLumoAddonCustomizer({
                    subscription,
                    couponConfig: undefined,
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.VPN2024]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                    hideLumoAddonForVpn2024: true,
                })
            ).toBe(false);
        });

        it('should return true if flag is enabled, user selects vpn2024 and already has the lumo addon in planIDs', () => {
            expect(
                showLumoAddonCustomizer({
                    subscription: FREE_SUBSCRIPTION,
                    couponConfig: undefined,
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.VPN2024]: 1,
                        [ADDON_NAMES.LUMO_VPN2024]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                    hideLumoAddonForVpn2024: true,
                })
            ).toBe(true);
        });

        it('should return true if user has vpn2024 subscription and selects another plan', () => {
            const subscription = buildSubscription(PLANS.VPN2024);

            expect(
                showLumoAddonCustomizer({
                    subscription,
                    couponConfig: undefined,
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.MAIL]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                    hideLumoAddonForVpn2024: true,
                })
            ).toBe(true);
        });

        it('should return true if flag is disabled and user selects vpn2024', () => {
            expect(
                showLumoAddonCustomizer({
                    subscription: FREE_SUBSCRIPTION,
                    couponConfig: undefined,
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.VPN2024]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                    hideLumoAddonForVpn2024: false,
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
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.LUMO]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                })
            ).toBe(false);
        });

        it('should return false if no plan is selected', () => {
            expect(
                showLumoAddonCustomizer({
                    subscription: FREE_SUBSCRIPTION,
                    couponConfig: undefined,
                    initialCoupon: undefined,
                    planIDs: {},
                    cycle: CYCLE.YEARLY,
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
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.MAIL]: 1,
                    },
                    cycle: CYCLE.YEARLY,
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
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.MAIL]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                })
            ).toBe(false);
        });

        it('should hide lumo addon banner if the initially selected coupon matches a BF2025 one', () => {
            expect(
                showLumoAddonCustomizer({
                    subscription: FREE_SUBSCRIPTION,
                    couponConfig: undefined,
                    initialCoupon: COUPON_CODES.BLACK_FRIDAY_2025,
                    planIDs: {
                        [PLANS.MAIL]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                })
            ).toBe(false);
        });

        it('should hide lumo addon banner if the condition matches the special VPN 15m offer for BF2025', () => {
            expect(
                showLumoAddonCustomizer({
                    subscription: FREE_SUBSCRIPTION,
                    couponConfig: undefined,
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.VPN2024]: 1,
                    },
                    cycle: CYCLE.FIFTEEN,
                })
            ).toBe(false);
        });

        it('should display lumo addon banner if it is already specified in planIDs', () => {
            expect(
                showLumoAddonCustomizer({
                    subscription: FREE_SUBSCRIPTION,
                    couponConfig: undefined,
                    initialCoupon: undefined,
                    planIDs: {
                        [PLANS.MAIL]: 1,
                        [ADDON_NAMES.LUMO_MAIL]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                })
            ).toBe(true);
        });
    });
});
