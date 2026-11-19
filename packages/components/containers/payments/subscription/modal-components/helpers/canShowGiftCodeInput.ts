import type { CYCLE } from '@proton/payments/core/constants';
import type { CouponConfigMetadata } from '@proton/payments/core/coupon-config/interface';
import type { PlanIDs } from '@proton/payments/core/interface';
import { isSubscriptionUnchanged, isUpcomingSubscriptionUnpaid } from '@proton/payments/core/subscription/helpers';
import type {
    Subscription,
    SubscriptionCheckForbiddenReason,
    SubscriptionEstimation,
} from '@proton/payments/core/subscription/interface';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';

function selectsUnpaidUpcomingChange(subscriptions: Subscription[], planIDs: PlanIDs, cycle: CYCLE): boolean {
    return subscriptions.some(
        (subscription) =>
            isUpcomingSubscriptionUnpaid(subscription) &&
            isSubscriptionUnchanged(subscription.UpcomingSubscription, planIDs, cycle) &&
            !isSubscriptionUnchanged(subscription, planIDs, cycle)
    );
}

export function canShowGiftCodeInput({
    paymentForbiddenReason,
    couponConfig,
    checkResult,
    subscriptions,
    planIDs,
    cycle,
}: {
    paymentForbiddenReason: SubscriptionCheckForbiddenReason;
    couponConfig: CouponConfigMetadata | undefined;
    checkResult: SubscriptionEstimation;
    subscriptions: Subscription[];
    planIDs: PlanIDs;
    cycle: CYCLE;
}): boolean {
    // if the selected modification is forbidden, then it doesn't make sense to show the coupon code input
    const isPaymentAllowed =
        !paymentForbiddenReason.forbidden ||
        // however if user is subscribed to the selected plan+cycle, then we can still display the gift code input,
        // because in case if the coupon is valid, then user can still re-subscribe to the same plan+cycle with the
        // coupon
        paymentForbiddenReason.reason === 'already-subscribed';

    return (
        isPaymentAllowed &&
        // For some coupons, we want explicitly hide the coupon code input
        !couponConfig?.hidden &&
        // If the modification causes a scheduled unpaid subscription, then the coupon won't be applied anyways, so we
        // don't show the coupon code input either
        checkResult.SubscriptionMode !== SubscriptionMode.ScheduledChargedLater &&
        !selectsUnpaidUpcomingChange(subscriptions, planIDs, cycle)
    );
}
