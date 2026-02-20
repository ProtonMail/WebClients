import { c, msgid } from 'ttag';

import type { PaymentsCheckoutUI } from '../../../core/checkout';
import type { Cycle, PlanIDs } from '../../../core/interface';
import { isLifetimePlanSelected } from '../../../core/plan/helpers';
import type { HeadlessCheckoutContextInner, HeadlessCheckoutCouponConfig } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const PLAN_AMOUNT_LINE_ITEM_TYPE = 'planAmount' as const;

export interface PlanAmountLineItem
    extends BaseLineItem<typeof PLAN_AMOUNT_LINE_ITEM_TYPE>, ReturnType<typeof formatPlanAmount> {}

/**
 * Computes the net total amount for the cycle, taking trial and hidden coupon
 * config into account.
 */
function computePlanAmount(
    checkout: PaymentsCheckoutUI,
    isTrial: boolean,
    couponConfig: HeadlessCheckoutCouponConfig | undefined
): number {
    const { checkResult, withDiscountPerCycle } = checkout;

    if (checkResult.Amount === 0 && isTrial) {
        return checkout.regularAmountPerCycleOptimistic;
    }

    if (couponConfig?.hidden) {
        return withDiscountPerCycle;
    }

    return checkResult.Amount;
}

function computeTotalBillingText(cycle: Cycle, planIDs: PlanIDs): string {
    if (isLifetimePlanSelected(planIDs)) {
        return c('Checkout row').t`Total`;
    }

    const n = cycle;
    return c('Checkout row').ngettext(msgid`Total for ${n} month`, `Total for ${n} months`, n);
}

function formatPlanAmount(ctx: HeadlessCheckoutContextInner) {
    const { cycle, planIDs, isPaidPlan, currency } = ctx;
    return {
        /** e.g. "Total for 12 months" or "Total" for lifetime */
        label: computeTotalBillingText(cycle, planIDs),
        amount: computePlanAmount(ctx.checkoutUi, ctx.isTrial, ctx.couponConfig),
        currency,
        visible: isPaidPlan,
    };
}

export function createPlanAmountItem(ctx: HeadlessCheckoutContextInner): PlanAmountLineItem {
    return {
        type: PLAN_AMOUNT_LINE_ITEM_TYPE,
        ...formatPlanAmount(ctx),
    };
}
