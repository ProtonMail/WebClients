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
    return (
        // if the selected modification is forbidden, then it doesn't make sense to show the coupon code input
        !paymentForbiddenReason.forbidden &&
        // For some coupons, we want explicitly hide the coupon code input
        !couponConfig?.hidden &&
        // If the modification causes a scheduled unpaid subscription, then the coupon won't be applied anyways, so we
        // don't show the coupon code input either
        checkResult.SubscriptionMode !== SubscriptionMode.ScheduledChargedLater
    );
}
