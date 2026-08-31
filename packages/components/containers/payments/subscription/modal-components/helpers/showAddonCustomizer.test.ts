import { ADDON_NAMES, ADDON_PREFIXES, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { SubscriptionPlatform } from '@proton/payments/core/subscription/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { showAddonCustomizer } from './showAddonCustomizer';

describe('showAddonCustomizer', () => {
    describe('lumo', () => {
        describe('externally managed lumo subscription', () => {
            it('should return false if current subscription is an externally managed lumo subscription', () => {
                const subscription = buildSubscription(PLANS.LUMO, { External: SubscriptionPlatform.Android });

                expect(
                    showAddonCustomizer(ADDON_PREFIXES.LUMO, {
                        subscription,
                        couponConfig: undefined,
                        planIDs: { [PLANS.MAIL]: 1 },
                    })
                ).toBe(false);
            });

            it('should return false if any secondary subscription is an externally managed lumo subscription', () => {
                const subscription = buildSubscription(PLANS.BUNDLE, {
                    SecondarySubscriptions: [buildSubscription(PLANS.LUMO, { External: SubscriptionPlatform.Android })],
                });

                expect(
                    showAddonCustomizer(ADDON_PREFIXES.LUMO, {
                        subscription,
                        couponConfig: undefined,
                        planIDs: { [PLANS.MAIL]: 1 },
                    })
                ).toBe(false);
            });

            it('should return true if current subscription is not an externally managed lumo subscription', () => {
                const subscription = buildSubscription(PLANS.MAIL, { External: SubscriptionPlatform.Default });

                expect(
                    showAddonCustomizer(ADDON_PREFIXES.LUMO, {
                        subscription,
                        couponConfig: undefined,
                        planIDs: { [PLANS.BUNDLE]: 1 },
                    })
                ).toBe(true);
            });
        });

        describe('selected plan support for lumo addon', () => {
            it('should return false if selected plan does not support lumo addon', () => {
                expect(
                    showAddonCustomizer(ADDON_PREFIXES.LUMO, {
                        subscription: FREE_SUBSCRIPTION,
                        couponConfig: undefined,
                        planIDs: { [PLANS.LUMO]: 1 },
                    })
                ).toBe(false);
            });

            it('should return false if no plan is selected', () => {
                expect(
                    showAddonCustomizer(ADDON_PREFIXES.LUMO, {
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
                    showAddonCustomizer(ADDON_PREFIXES.LUMO, {
                        subscription,
                        couponConfig: undefined,
                        planIDs: { [PLANS.MAIL]: 1 },
                    })
                ).toBe(true);
            });
        });

        describe('Custom overrides', () => {
            it('should hide lumo addon customizer if hideLumoAddonBanner is true', () => {
                expect(
                    showAddonCustomizer(ADDON_PREFIXES.LUMO, {
                        subscription: FREE_SUBSCRIPTION,
                        couponConfig: { hideLumoAddonBanner: true, coupons: [], hidden: false },
                        planIDs: { [PLANS.MAIL]: 1 },
                    })
                ).toBe(false);
            });

            it('should display lumo addon banner if it is already specified in planIDs', () => {
                expect(
                    showAddonCustomizer(ADDON_PREFIXES.LUMO, {
                        subscription: FREE_SUBSCRIPTION,
                        couponConfig: undefined,
                        planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 },
                    })
                ).toBe(true);
            });

            it('should display lumo addon banner even if hideLumoAddonBanner is true when the addon is already in planIDs', () => {
                expect(
                    showAddonCustomizer(ADDON_PREFIXES.LUMO, {
                        subscription: FREE_SUBSCRIPTION,
                        couponConfig: { hideLumoAddonBanner: true, coupons: [], hidden: false },
                        planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 },
                    })
                ).toBe(true);
            });
        });
    });

    describe('meet', () => {
        describe('selected plan support for meet addon', () => {
            it('should return false if selected plan does not support meet addon', () => {
                expect(
                    showAddonCustomizer(ADDON_PREFIXES.MEET, {
                        subscription: FREE_SUBSCRIPTION,
                        couponConfig: undefined,
                        planIDs: { [PLANS.MEET]: 1 },
                    })
                ).toBe(false);
            });

            it('should return false if no plan is selected', () => {
                expect(
                    showAddonCustomizer(ADDON_PREFIXES.MEET, {
                        subscription: FREE_SUBSCRIPTION,
                        couponConfig: undefined,
                        planIDs: {},
                    })
                ).toBe(false);
            });

            it('should return true if selected plan supports meet addon', () => {
                expect(
                    showAddonCustomizer(ADDON_PREFIXES.MEET, {
                        subscription: FREE_SUBSCRIPTION,
                        couponConfig: undefined,
                        planIDs: { [PLANS.BUNDLE]: 1 },
                    })
                ).toBe(true);
            });
        });

        describe('Custom overrides', () => {
            it('should hide meet addon customizer if hideMeetAddonBanner is true', () => {
                expect(
                    showAddonCustomizer(ADDON_PREFIXES.MEET, {
                        subscription: FREE_SUBSCRIPTION,
                        couponConfig: { hideMeetAddonBanner: true, coupons: [], hidden: false },
                        planIDs: { [PLANS.BUNDLE]: 1 },
                    })
                ).toBe(false);
            });

            it('should display meet addon banner if it is already specified in planIDs', () => {
                expect(
                    showAddonCustomizer(ADDON_PREFIXES.MEET, {
                        subscription: FREE_SUBSCRIPTION,
                        couponConfig: undefined,
                        planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.MEET_MAIL]: 1 },
                    })
                ).toBe(true);
            });

            it('should display meet addon banner even if hideMeetAddonBanner is true when the addon is already in planIDs', () => {
                expect(
                    showAddonCustomizer(ADDON_PREFIXES.MEET, {
                        subscription: FREE_SUBSCRIPTION,
                        couponConfig: { hideMeetAddonBanner: true, coupons: [], hidden: false },
                        planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.MEET_MAIL]: 1 },
                    })
                ).toBe(true);
            });
        });
    });
});
