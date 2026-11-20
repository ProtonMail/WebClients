import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import { getIsPromotionAlreadyApplied } from './getIsPromotionAlreadyApplied';

const promotionCoupon = 'LUMOPROMO';

const webMailPlus = buildSubscription(
    { planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' },
    { ID: 'mail-plus', CouponCode: null }
);

const webLumoPlusWithPromotion = buildLumoSubscription(PLANS.LUMO, {
    ID: 'lumo-plus',
    Cycle: CYCLE.MONTHLY,
    CouponCode: promotionCoupon,
});

describe('getIsPromotionAlreadyApplied', () => {
    it('recognises the promotion already applied to the Lumo Plus subscription the purchase changes', () => {
        const multiSubscriptionContext = buildMultiSubscriptionContext([webMailPlus, webLumoPlusWithPromotion]);

        expect(
            getIsPromotionAlreadyApplied({
                multiSubscriptionContext,
                plan: PLANS.LUMO,
                requestedPlanName: PLANS.LUMO,
                cycle: CYCLE.MONTHLY,
                coupon: promotionCoupon,
            })
        ).toBe(true);
    });

    it('compares the offer with the upcoming term of the changed subscription', () => {
        const lumoPlusWithUpcomingPromotion: Subscription = {
            ...buildLumoSubscription(PLANS.LUMO, { ID: 'lumo-plus', Cycle: CYCLE.MONTHLY, CouponCode: null }),
            UpcomingSubscription: buildLumoSubscription(PLANS.LUMO, {
                ID: 'lumo-plus-upcoming',
                Cycle: CYCLE.YEARLY,
                CouponCode: promotionCoupon,
            }),
        };
        const multiSubscriptionContext = buildMultiSubscriptionContext([webMailPlus, lumoPlusWithUpcomingPromotion]);

        expect(
            getIsPromotionAlreadyApplied({
                multiSubscriptionContext,
                plan: PLANS.LUMO,
                requestedPlanName: PLANS.LUMO,
                cycle: CYCLE.YEARLY,
                coupon: promotionCoupon,
            })
        ).toBe(true);
        expect(
            getIsPromotionAlreadyApplied({
                multiSubscriptionContext,
                plan: PLANS.LUMO,
                requestedPlanName: PLANS.LUMO,
                cycle: CYCLE.MONTHLY,
                coupon: promotionCoupon,
            })
        ).toBe(false);
    });

    it('never shows a purchase the subscriptions refuse as already applied', () => {
        const mobileLumoPlus = buildLumoSubscription(PLANS.LUMO, {
            Cycle: CYCLE.MONTHLY,
            CouponCode: promotionCoupon,
            External: SubscriptionPlatform.iOS,
        });

        expect(
            getIsPromotionAlreadyApplied({
                multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(mobileLumoPlus),
                plan: PLANS.LUMO,
                requestedPlanName: PLANS.LUMO,
                cycle: CYCLE.MONTHLY,
                coupon: promotionCoupon,
            })
        ).toBe(false);
    });

    describe('with only Unlimited bought with the promotion, opening a Lumo Plus link with it', () => {
        const unlimitedWithPromotion = buildSubscription(
            { planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'CHF' },
            { CouponCode: promotionCoupon }
        );
        const params = {
            plan: PLANS.LUMO,
            requestedPlanName: PLANS.LUMO,
            cycle: CYCLE.YEARLY,
            coupon: promotionCoupon,
        };

        it('goes to the Lumo Plus checkout for a new subscription when multiple subscriptions are enabled', () => {
            expect(
                getIsPromotionAlreadyApplied({
                    ...params,
                    multiSubscriptionContext: buildMultiSubscriptionContext([unlimitedWithPromotion]),
                })
            ).toBe(false);
        });

        it('still treats it as a downgrade of Unlimited when multiple subscriptions are disabled', () => {
            expect(
                getIsPromotionAlreadyApplied({
                    ...params,
                    multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(unlimitedWithPromotion),
                })
            ).toBe(true);
        });
    });

    describe('with one subscription', () => {
        const mailPlusWithPromotion = buildSubscription(
            { planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' },
            { CouponCode: promotionCoupon }
        );
        const bundleWithPromotion = buildSubscription(
            { planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'CHF' },
            { CouponCode: promotionCoupon }
        );
        const familyWithPromotion = buildSubscription(
            { planName: PLANS.FAMILY, cycle: CYCLE.YEARLY, currency: 'CHF' },
            { CouponCode: promotionCoupon }
        );
        const visionaryWithPromotion = buildSubscription(
            { planName: PLANS.VISIONARY, cycle: CYCLE.YEARLY, currency: 'CHF' },
            { CouponCode: promotionCoupon }
        );

        it.each([
            { name: 'the same offer', subscription: mailPlusWithPromotion, plan: PLANS.MAIL, expected: true },
            {
                name: 'the same plan on another cycle',
                subscription: mailPlusWithPromotion,
                plan: PLANS.MAIL,
                cycle: CYCLE.MONTHLY,
                expected: false,
            },
            {
                name: 'the same plan with another coupon',
                subscription: mailPlusWithPromotion,
                plan: PLANS.MAIL,
                coupon: 'OTHER',
                expected: false,
            },
            { name: 'a Bundle downgrade', subscription: bundleWithPromotion, plan: PLANS.MAIL, expected: true },
            { name: 'a Family downgrade', subscription: familyWithPromotion, plan: PLANS.BUNDLE, expected: true },
            { name: 'a Visionary downgrade', subscription: visionaryWithPromotion, plan: PLANS.MAIL, expected: true },
        ])(
            'answers $expected for $name, with and without multiple subscriptions enabled',
            ({ subscription, plan, cycle = CYCLE.YEARLY, coupon = promotionCoupon, expected }) => {
                const params = { plan, requestedPlanName: plan, cycle, coupon };

                expect(
                    getIsPromotionAlreadyApplied({
                        ...params,
                        multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(subscription),
                    })
                ).toBe(expected);
                expect(
                    getIsPromotionAlreadyApplied({
                        ...params,
                        multiSubscriptionContext: buildMultiSubscriptionContext([subscription]),
                    })
                ).toBe(expected);
            }
        );
    });
});
