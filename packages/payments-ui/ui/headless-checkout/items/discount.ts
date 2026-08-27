import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const DISCOUNT_LINE_ITEM_TYPE = 'discount' as const;

export interface DiscountLineItem
    extends BaseLineItem<typeof DISCOUNT_LINE_ITEM_TYPE>, ReturnType<typeof formatDiscount> {}

function formatDiscount(ctx: HeadlessCheckoutContextInner) {
    const { checkoutUi, modifiers, currency, isTrial, optimisticCheckoutUi } = ctx;
    const {
        discountPercent,
        withoutDiscountPerCycle,
        withDiscountPerCycle,
        withoutDiscountPerMonth,
        withDiscountPerMonth,
        couponDiscount,
    } = checkoutUi;

    const viewDiscountPercent = isTrial ? optimisticCheckoutUi.discountPercent : discountPercent;

    return {
        /** Discount percentage, e.g. 20 for 20% off */
        discountPercent: viewDiscountPercent,
        withoutDiscountPerCycle,
        withDiscountPerCycle,
        withoutDiscountPerMonth,
        withDiscountPerMonth,
        currency,
        couponDiscount,
        visible: checkoutUi.discountPercent !== 0 && !modifiers.isCustomBilling,
    };
}

export function createDiscountItem(ctx: HeadlessCheckoutContextInner): DiscountLineItem {
    return {
        type: DISCOUNT_LINE_ITEM_TYPE,
        ...formatDiscount(ctx),
    };
}
