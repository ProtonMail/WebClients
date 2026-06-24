import type { CheckSubscriptionData } from '../../core/api/api';
import { getPlanNameFromIDs } from '../../core/plan/helpers';
import type { CouponDiscountBreakdownBE, SubscriptionEstimation } from '../../core/subscription/interface';
import { getStaticCouponConfig } from './get-static-coupon-config';
import type { CouponConfig } from './interface';

/**
 * Picks the requested entries from a coupon's static `mockCouponDiscountBreakdown` for the response's
 * currency/cycle. Returns undefined when no mock exists or none of its entries are part of the request.
 */
const getMockBreakdown = (
    couponConfig: CouponConfig,
    result: SubscriptionEstimation,
    data: CheckSubscriptionData
): CouponDiscountBreakdownBE | undefined => {
    const mock = couponConfig.mockCouponDiscountBreakdown?.[result.Currency]?.[result.Cycle];
    if (!mock) {
        return undefined;
    }

    const requestedBreakdown = mock.filter(({ Name }) => data.Plans[Name] !== undefined);
    return requestedBreakdown.length === 0 ? undefined : requestedBreakdown;
};

/**
 * A hidden coupon's discount is folded into the displayed prices rather than shown as a separate line, so there
 * is no per-addon split to surface. We therefore attribute the entire discount to the base plan, which is what
 * the checkout assumes when it can't break the discount down per line.
 */
const getHiddenCouponBreakdown = (
    couponDiscount: number,
    data: CheckSubscriptionData
): CouponDiscountBreakdownBE | undefined => {
    const basePlanName = getPlanNameFromIDs(data.Plans);
    if (!basePlanName) {
        return undefined;
    }

    return [{ Name: basePlanName, Amount: couponDiscount }];
};

/**
 * Fills in `CouponDiscountBreakdown` on the check response so the rest of the checkout can treat it as if the
 * backend returned it. This is a temporary bridge until the backend ships the field. Two sources are tried, in
 * order: a coupon's static `mockCouponDiscountBreakdown` config, then — for a hidden coupon with no mock — a
 * synthesized base-plan-only breakdown carrying the whole discount.
 *
 * It is a no-op unless every guard passes, so it can never corrupt a real checkout:
 * - the backend already returned a breakdown (authoritative — never overwritten),
 * - no static config matches the applied coupon,
 * - the discount amount is missing, or
 * - neither source yields a breakdown that belongs to the request.
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

        const couponConfig = getStaticCouponConfig(couponCode);
        if (!couponConfig) {
            return;
        }

        const couponDiscount = result.CouponDiscount;
        if (couponDiscount === undefined || couponDiscount === null) {
            return;
        }

        const breakdown =
            getMockBreakdown(couponConfig, result, data) ??
            (couponConfig.hidden ? getHiddenCouponBreakdown(couponDiscount, data) : undefined);

        if (!breakdown) {
            return;
        }

        result.Coupon.CouponDiscountBreakdown = breakdown;
    } catch {}
};
