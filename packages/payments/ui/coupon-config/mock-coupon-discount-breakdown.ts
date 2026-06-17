import type { CheckSubscriptionData } from '../../core/api/api';
import type { SubscriptionEstimation } from '../../core/subscription/interface';
import { getStaticCouponConfig } from './get-static-coupon-config';

/**
 * Fills in `CouponDiscountBreakdown` on the check response from a coupon's static `mockCouponDiscountBreakdown`
 * config, so the rest of the checkout can treat it as if the backend returned it. This is a temporary bridge
 * until the backend ships the field.
 *
 * It is a no-op unless every guard passes, so it can never corrupt a real checkout:
 * - the backend already returned a breakdown (authoritative — never overwritten),
 * - no static config matches the applied coupon, or it has no mock for this currency/cycle, or
 * - none of the mock entries are part of the request.
 */
export const enrichMockCouponDiscountBreakdown = (
    result: SubscriptionEstimation,
    data: CheckSubscriptionData
): void => {
    if (!result.Coupon || result.Coupon.CouponDiscountBreakdown) {
        return;
    }

    try {
        const couponCode = data.CouponCode ?? data.Codes?.[0];
        if (!couponCode) {
            return;
        }

        const mock = getStaticCouponConfig(couponCode)?.mockCouponDiscountBreakdown?.[result.Currency]?.[result.Cycle];
        if (!mock) {
            return;
        }

        const couponDiscount = result.CouponDiscount;
        if (couponDiscount === undefined || couponDiscount === null) {
            return;
        }

        const requestedBreakdown = mock.filter(({ Name }) => data.Plans[Name] !== undefined);
        if (requestedBreakdown.length === 0) {
            return;
        }

        result.Coupon.CouponDiscountBreakdown = requestedBreakdown;
    } catch {}
};
