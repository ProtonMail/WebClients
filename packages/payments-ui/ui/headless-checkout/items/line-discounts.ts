import type { CheckoutCouponDiscountBreakdown, PaymentsCheckoutUI } from '@proton/payments/core/checkout';
import { CYCLE } from '@proton/payments/core/constants';
import type { Cycle } from '@proton/payments/core/interface';

import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';

type CheckoutAddon = PaymentsCheckoutUI['addons'][number];

const getDiscountPercent = (withoutDiscount: number, withDiscount: number) =>
    withoutDiscount > 0 ? Math.round(100 * ((withoutDiscount - withDiscount) / withoutDiscount)) : 0;

/**
 * Picks the discount that the check response splits per line: the offer's, or without an offer the coupon's.
 *
 * @param ctx - Headless checkout context.
 * @param ctx.checkoutUi - Checkout data holding the offer and coupon discounts.
 * @param ctx.couponConfig - Coupon config, whose `hidden` flag inlines the coupon discount.
 * @param ctx.hasOffer - Whether the check applied an offer.
 * @returns The discount total per cycle (negative cents), its per-line breakdown, and `inlined`: whether the rows show
 *   their discounted price instead of a separate discount row.
 */
export function getLineDiscount({ checkoutUi, couponConfig, hasOffer }: HeadlessCheckoutContextInner) {
    return hasOffer
        ? { total: checkoutUi.offerDiscount, breakdown: checkoutUi.offerDiscountBreakdown, inlined: true }
        : {
              total: checkoutUi.couponDiscount,
              breakdown: checkoutUi.couponDiscountBreakdown,
              inlined: !!couponConfig?.hidden,
          };
}

export function getAddonLinePricing(
    addon: CheckoutAddon,
    cycle: Cycle,
    couponDiscountBreakdown: CheckoutCouponDiscountBreakdown
) {
    const basePricePerOnePerMonth = addon.pricing[CYCLE.MONTHLY] || 0;
    const basePriceForAllPerMonth = addon.quantity * basePricePerOnePerMonth;
    const basePricePerOnePerCycle = addon.pricing[cycle] || 0;
    const basePriceForAllPerCycle = addon.quantity * basePricePerOnePerCycle;
    const monthlyRenewalsPriceForAllPerCycle = basePriceForAllPerMonth * cycle;
    const couponDiscountPerCycle = Math.abs(couponDiscountBreakdown?.perAddonPerCycleDiscount[addon.name] ?? 0);
    const withDiscountForAllPerCycle = basePriceForAllPerCycle - couponDiscountPerCycle;

    return {
        basePricePerOnePerCycle,
        basePriceForAllPerMonth,
        basePriceForAllPerCycle,
        monthlyRenewalsPriceForAllPerCycle,
        couponDiscountPerCycle,
        withDiscountForAllPerCycle,
        discountPerCycle: monthlyRenewalsPriceForAllPerCycle - withDiscountForAllPerCycle,
        discountPercent: getDiscountPercent(monthlyRenewalsPriceForAllPerCycle, withDiscountForAllPerCycle),
    };
}

export function getPlanDiscountPercent(ctx: HeadlessCheckoutContextInner) {
    const { checkoutUi, cycle } = ctx;
    const { addons } = checkoutUi;
    const { total, breakdown, inlined } = getLineDiscount(ctx);
    const totalDiscountPerCycle = Math.abs(total || 0);

    const isBasePlanOnly = inlined && !!breakdown && addons.length > 0 && totalDiscountPerCycle !== 0;

    if (!isBasePlanOnly) {
        return checkoutUi.discountPercent;
    }

    const addonLines = addons.map((addon) => getAddonLinePricing(addon, cycle, breakdown));
    const sumOf = (pick: (line: (typeof addonLines)[number]) => number) =>
        addonLines.reduce((acc, line) => acc + pick(line), 0);

    const basePlanWithoutDiscountPerCycle =
        checkoutUi.withoutDiscountPerCycle - sumOf((line) => line.monthlyRenewalsPriceForAllPerCycle);
    const basePlanDiscountPerCycle = totalDiscountPerCycle - sumOf((line) => line.couponDiscountPerCycle);
    const basePlanWithDiscountPerCycle =
        checkoutUi.regularAmountPerCycle - sumOf((line) => line.basePriceForAllPerCycle) - basePlanDiscountPerCycle;

    return getDiscountPercent(basePlanWithoutDiscountPerCycle, basePlanWithDiscountPerCycle);
}
