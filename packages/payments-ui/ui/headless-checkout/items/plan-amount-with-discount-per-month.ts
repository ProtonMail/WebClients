import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const PLAN_AMOUNT_WITH_DISCOUNT_PER_MONTH_LINE_ITEM_TYPE = 'planAmountWithDiscountPerMonth' as const;

export interface PlanAmountWithDiscountPerMonthLineItem
    extends
        BaseLineItem<typeof PLAN_AMOUNT_WITH_DISCOUNT_PER_MONTH_LINE_ITEM_TYPE>,
        ReturnType<typeof formatPlanAmountWithDiscount> {}

function formatPlanAmountWithDiscount(ctx: HeadlessCheckoutContextInner) {
    const { checkoutUi, isPaidPlan, currency } = ctx;

    return {
        planAmountWithDiscountPerMonth: checkoutUi.withDiscountPerMonth,
        currency,
        visible: isPaidPlan,
    };
}

export function createPlanAmountWithDiscountPerMonthItem(
    ctx: HeadlessCheckoutContextInner
): PlanAmountWithDiscountPerMonthLineItem {
    return {
        type: PLAN_AMOUNT_WITH_DISCOUNT_PER_MONTH_LINE_ITEM_TYPE,
        ...formatPlanAmountWithDiscount(ctx),
    };
}
