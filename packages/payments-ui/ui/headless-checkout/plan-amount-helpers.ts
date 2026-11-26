import type { HeadlessCheckoutContextInner } from './get-headless-checkout';

/**
 * Computes the net total amount for the cycle, taking trial, hidden coupon
 * config and offers into account.
 *
 * @param ctx - Headless checkout context.
 * @returns The amount of the "Total for N months" row in cents: the regular amount for a trial, the discounted amount
 *   when a hidden coupon or an offer is inlined, otherwise the amount of the check.
 */
export function computePlanAmount(ctx: HeadlessCheckoutContextInner): number {
    const { isTrial, hasInvisibleCoupon, hasOffer, checkoutUi } = ctx;
    const { checkResult, withDiscountPerCycle, regularAmountPerCycleOptimistic } = checkoutUi;

    if (checkResult.Amount === 0 && isTrial) {
        return regularAmountPerCycleOptimistic;
    }

    if (hasInvisibleCoupon || hasOffer) {
        return withDiscountPerCycle;
    }

    return checkResult.Amount;
}
