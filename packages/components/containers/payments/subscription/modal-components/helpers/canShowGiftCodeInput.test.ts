import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { CouponConfigMetadata } from '@proton/payments/core/coupon-config/interface';
import { getPlanIDs } from '@proton/payments/core/subscription/helpers';
import type {
    SubscriptionCheckForbiddenReason,
    SubscriptionEstimation,
} from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';

import { canShowGiftCodeInput } from './canShowGiftCodeInput';

const allowed: SubscriptionCheckForbiddenReason = { forbidden: false };

const baseInput = {
    paymentForbiddenReason: allowed,
    couponConfig: undefined as CouponConfigMetadata | undefined,
    checkResult: { SubscriptionMode: SubscriptionMode.Regular } as SubscriptionEstimation,
    subscriptions: [],
    planIDs: { [PLANS.MAIL]: 1 },
    cycle: CYCLE.YEARLY,
};

const buildTwoYearSubscriptionWithUpcoming = ({ IsPrepaid }: { IsPrepaid: boolean }) =>
    buildSubscription(
        { planName: PLANS.BUNDLE, cycle: CYCLE.TWO_YEARS, currency: 'USD' },
        {
            UpcomingSubscription: buildSubscription(
                { planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'USD' },
                { IsPrepaid }
            ),
        }
    );

describe('canShowGiftCodeInput', () => {
    it('returns true when payment is allowed, no coupon config, regular mode', () => {
        expect(canShowGiftCodeInput(baseInput)).toBe(true);
    });

    it('returns true when forbidden reason is already-subscribed', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                paymentForbiddenReason: { forbidden: true, reason: 'already-subscribed' },
            })
        ).toBe(true);
    });

    it('returns false when forbidden reason is already-subscribed-externally', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                paymentForbiddenReason: { forbidden: true, reason: 'already-subscribed-externally' },
            })
        ).toBe(false);
    });

    it('returns false when forbidden reason is offer-not-available', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                paymentForbiddenReason: { forbidden: true, reason: 'offer-not-available' },
            })
        ).toBe(false);
    });

    it('returns false when couponConfig.hidden is true', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                couponConfig: { hidden: true } as CouponConfigMetadata,
            })
        ).toBe(false);
    });

    it('returns true when couponConfig is undefined', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                couponConfig: undefined,
            })
        ).toBe(true);
    });

    it('returns true when couponConfig.hidden is false', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                couponConfig: { hidden: false } as CouponConfigMetadata,
            })
        ).toBe(true);
    });

    it('returns false when SubscriptionMode is ScheduledChargedLater', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                checkResult: { SubscriptionMode: SubscriptionMode.ScheduledChargedLater } as SubscriptionEstimation,
            })
        ).toBe(false);
    });

    it.each([SubscriptionMode.CustomBillings, SubscriptionMode.ScheduledChargedImmediately])(
        'returns true for SubscriptionMode %s',
        (mode) => {
            expect(
                canShowGiftCodeInput({
                    ...baseInput,
                    checkResult: { SubscriptionMode: mode } as SubscriptionEstimation,
                })
            ).toBe(true);
        }
    );

    describe('when the subscription has an upcoming subscription', () => {
        const alreadySubscribed: SubscriptionCheckForbiddenReason = { forbidden: true, reason: 'already-subscribed' };

        it('returns false when the selection is the same as the unpaid upcoming subscription', () => {
            const subscription = buildTwoYearSubscriptionWithUpcoming({ IsPrepaid: false });

            expect(
                canShowGiftCodeInput({
                    ...baseInput,
                    paymentForbiddenReason: alreadySubscribed,
                    subscriptions: [subscription],
                    planIDs: getPlanIDs(subscription.UpcomingSubscription),
                    cycle: CYCLE.YEARLY,
                })
            ).toBe(false);
        });

        it('returns true when the selection is the same as the current subscription', () => {
            const subscription = buildTwoYearSubscriptionWithUpcoming({ IsPrepaid: false });

            expect(
                canShowGiftCodeInput({
                    ...baseInput,
                    paymentForbiddenReason: alreadySubscribed,
                    subscriptions: [subscription],
                    planIDs: getPlanIDs(subscription),
                    cycle: CYCLE.TWO_YEARS,
                })
            ).toBe(true);
        });

        it('returns true when the unpaid upcoming subscription renews the selected current plan and cycle', () => {
            const subscription = buildSubscription(
                { planName: PLANS.VPN2024, cycle: CYCLE.YEARLY, currency: 'EUR' },
                {
                    UpcomingSubscription: buildSubscription(
                        { planName: PLANS.VPN2024, cycle: CYCLE.YEARLY, currency: 'EUR' },
                        { IsPrepaid: false }
                    ),
                }
            );

            expect(
                canShowGiftCodeInput({
                    ...baseInput,
                    paymentForbiddenReason: alreadySubscribed,
                    subscriptions: [subscription],
                    planIDs: getPlanIDs(subscription),
                    cycle: CYCLE.YEARLY,
                })
            ).toBe(true);
        });

        it('returns true when the selection is the same as a prepaid upcoming subscription', () => {
            const subscription = buildTwoYearSubscriptionWithUpcoming({ IsPrepaid: true });

            expect(
                canShowGiftCodeInput({
                    ...baseInput,
                    paymentForbiddenReason: alreadySubscribed,
                    subscriptions: [subscription],
                    planIDs: getPlanIDs(subscription.UpcomingSubscription),
                    cycle: CYCLE.YEARLY,
                })
            ).toBe(true);
        });
    });
});
