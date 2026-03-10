import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { type SubscriptionCheckForbiddenReason, SubscriptionMode } from '@proton/payments/index';

import type { CouponConfigRendered } from '../../coupon-config/useCouponConfig';

export function canShowGiftCodeInput({
    paymentForbiddenReason,
    couponConfig,
    checkResult,
}: {
    paymentForbiddenReason: SubscriptionCheckForbiddenReason;
    couponConfig: CouponConfigRendered | undefined;
    checkResult: SubscriptionEstimation;
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
        checkResult.SubscriptionMode !== SubscriptionMode.ScheduledChargedLater
    );
}
