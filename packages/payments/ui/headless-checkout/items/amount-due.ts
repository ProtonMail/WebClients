import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const AMOUNT_DUE_LINE_ITEM_TYPE = 'amountDue' as const;

export interface AmountDueLineItem
    extends BaseLineItem<typeof AMOUNT_DUE_LINE_ITEM_TYPE>, ReturnType<typeof formatAmountDue> {}

function formatAmountDue(ctx: HeadlessCheckoutContextInner) {
    const { checkResult, currency, cycle, planIDs, planName, planTitle } = ctx;

    return {
        amountDue: checkResult.AmountDue || 0,
        currency,
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
