import { c, msgid } from 'ttag';

import type { Cycle, PlanIDs } from '@proton/payments/core/interface';
import { isLifetimePlanSelected } from '@proton/payments/core/plan/helpers';

import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const AMOUNT_DUE_LINE_ITEM_TYPE = 'amountDue' as const;

function computeAmountDueLabel(isTrial: boolean) {
    return isTrial ? c('Checkout row').t`Amount due now` : c('Checkout row').t`Amount due`;
}

function computeTotalBillingText(cycle: Cycle, planIDs: PlanIDs): string {
    if (isLifetimePlanSelected(planIDs)) {
        return c('Checkout row').t`Total`;
    }

    return c('Checkout row').ngettext(msgid`Total for ${cycle} month`, `Total for ${cycle} months`, cycle);
}

export interface AmountDueLineItem
    extends BaseLineItem<typeof AMOUNT_DUE_LINE_ITEM_TYPE>, ReturnType<typeof formatAmountDue> {}

function formatAmountDue(ctx: HeadlessCheckoutContextInner) {
    const { checkResult, currency, cycle, planIDs, planName, planTitle, isTrial } = ctx;

    const labelTotalAmount = computeTotalBillingText(cycle, planIDs);
    const label = computeAmountDueLabel(isTrial);

    return {
        amountDue: checkResult.AmountDue || 0,
        currency,
        labelTotalAmount,
        label,
        visible: true,
        cycle,
        planIDs,
        planName,
        planTitle,
    };
}

export function createAmountDueItem(ctx: HeadlessCheckoutContextInner): AmountDueLineItem {
    return {
        type: AMOUNT_DUE_LINE_ITEM_TYPE,
        ...formatAmountDue(ctx),
    };
}
