import type { HeadlessCheckoutContextInner } from './get-headless-checkout';

/**
 * Computes the net total amount for the cycle, taking trial and hidden coupon
 * config into account.
 */
export function computePlanAmount(ctx: HeadlessCheckoutContextInner): number {
    const { isTrial, hasInvisibleCoupon, checkoutUi } = ctx;
    const { checkResult, withDiscountPerCycle, regularAmountPerCycleOptimistic } = checkoutUi;

    if (checkResult.Amount === 0 && isTrial) {
        return regularAmountPerCycleOptimistic;
    }

    if (hasInvisibleCoupon) {
        return withDiscountPerCycle;
    }

    return checkResult.Amount;
}
