import type { CheckoutCouponDiscountBreakdown, PaymentsCheckoutUI } from '@proton/payments/core/checkout';
import { CYCLE } from '@proton/payments/core/constants';
import type { Cycle } from '@proton/payments/core/interface';

import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';

type CheckoutAddon = PaymentsCheckoutUI['addons'][number];

const getDiscountPercent = (withoutDiscount: number, withDiscount: number) =>
    withoutDiscount > 0 ? Math.round(100 * ((withoutDiscount - withDiscount) / withoutDiscount)) : 0;

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
    const { checkoutUi, cycle, couponConfig } = ctx;
    const { couponDiscountBreakdown, addons } = checkoutUi;
    const totalCouponDiscountPerCycle = Math.abs(checkoutUi.couponDiscount || 0);

    const isBasePlanOnly =
        !!couponConfig?.hidden && !!couponDiscountBreakdown && addons.length > 0 && totalCouponDiscountPerCycle !== 0;

    if (!isBasePlanOnly) {
        return checkoutUi.discountPercent;
    }

    const addonLines = addons.map((addon) => getAddonLinePricing(addon, cycle, couponDiscountBreakdown));
    const sumOf = (pick: (line: (typeof addonLines)[number]) => number) =>
        addonLines.reduce((acc, line) => acc + pick(line), 0);

    const basePlanWithoutDiscountPerCycle =
        checkoutUi.withoutDiscountPerCycle - sumOf((line) => line.monthlyRenewalsPriceForAllPerCycle);
    const basePlanCouponDiscountPerCycle = totalCouponDiscountPerCycle - sumOf((line) => line.couponDiscountPerCycle);
    const basePlanWithDiscountPerCycle =
        checkoutUi.regularAmountPerCycle -
        sumOf((line) => line.basePriceForAllPerCycle) -
        basePlanCouponDiscountPerCycle;

    return getDiscountPercent(basePlanWithoutDiscountPerCycle, basePlanWithDiscountPerCycle);
}
