import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const PLAN_AMOUNT_WITH_DISCOUNT_LINE_ITEM_TYPE = 'planAmountWithDiscount' as const;

export interface PlanAmountWithDiscountLineItem
    extends
        BaseLineItem<typeof PLAN_AMOUNT_WITH_DISCOUNT_LINE_ITEM_TYPE>,
        ReturnType<typeof formatPlanAmountWithDiscount> {}

function formatPlanAmountWithDiscount(ctx: HeadlessCheckoutContextInner) {
    const { checkoutUi, isTaxExclusive, currency } = ctx;

    return {
        /** Net amount before tax (withDiscountPerCycle) */
        planAmountWithDiscount: checkoutUi.withDiscountPerCycle,
        currency,
        visible: isTaxExclusive,
    };
}

export function createNetAmountItem(ctx: HeadlessCheckoutContextInner): PlanAmountWithDiscountLineItem {
    return {
        type: PLAN_AMOUNT_WITH_DISCOUNT_LINE_ITEM_TYPE,
        ...formatPlanAmountWithDiscount(ctx),
    };
}
