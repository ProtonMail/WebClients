import { formatIntlPercent } from '@proton/shared/lib/i18n/formatIntlPercent';

import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';
import { getPlanDiscountPercent } from './line-discounts';

export const PLAN_DISCOUNT_LINE_ITEM_TYPE = 'planDiscount' as const;

export interface PlanDiscountLineItem
    extends BaseLineItem<typeof PLAN_DISCOUNT_LINE_ITEM_TYPE>, ReturnType<typeof formatPlanDiscount> {}

function formatPlanDiscount(ctx: HeadlessCheckoutContextInner) {
    const { modifiers, isTrial, optimisticCheckoutUi } = ctx;

    const discountPercent = isTrial ? optimisticCheckoutUi.discountPercent : getPlanDiscountPercent(ctx);

    return {
        discountPercent,
        formattedDiscount: formatIntlPercent(-discountPercent),
        visible: discountPercent !== 0 && !modifiers.isCustomBilling,
    };
}

export function createPlanDiscountItem(ctx: HeadlessCheckoutContextInner): PlanDiscountLineItem {
    return {
        type: PLAN_DISCOUNT_LINE_ITEM_TYPE,
        ...formatPlanDiscount(ctx),
    };
}
