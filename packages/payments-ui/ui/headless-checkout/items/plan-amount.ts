import { c, msgid } from 'ttag';

import type { Cycle, PlanIDs } from '@proton/payments/core/interface';
import { isLifetimePlanSelected } from '@proton/payments/core/plan/helpers';

import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import { computePlanAmount } from '../plan-amount-helpers';
import type { BaseLineItem } from './base-line-item';

export const PLAN_AMOUNT_LINE_ITEM_TYPE = 'planAmount' as const;

export interface PlanAmountLineItem
    extends BaseLineItem<typeof PLAN_AMOUNT_LINE_ITEM_TYPE>, ReturnType<typeof formatPlanAmount> {}

function computeTotalBillingText(cycle: Cycle, planIDs: PlanIDs, isTaxExclusive: boolean = false): string {
    if (isLifetimePlanSelected(planIDs)) {
        if (isTaxExclusive) {
            return c('Checkout row').t`Subtotal`;
        }

        return c('Checkout row').t`Total`;
    }

    if (isTaxExclusive) {
        return c('Checkout row').ngettext(msgid`Subtotal for ${cycle} month`, `Subtotal for ${cycle} months`, cycle);
    }

    return c('Checkout row').ngettext(msgid`Total for ${cycle} month`, `Total for ${cycle} months`, cycle);
}

function formatPlanAmount(ctx: HeadlessCheckoutContextInner) {
    const { cycle, planIDs, isPaidPlan, isTaxExclusive, currency } = ctx;
    return {
        /** e.g. "Total for 12 months" or "Total" for lifetime */
        label: computeTotalBillingText(cycle, planIDs, isTaxExclusive),
        amount: computePlanAmount(ctx),
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
