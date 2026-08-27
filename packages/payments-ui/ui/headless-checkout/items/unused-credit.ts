import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const UNUSED_CREDIT_LINE_ITEM_TYPE = 'unusedCredit' as const;

export interface UnusedCreditLineItem
    extends BaseLineItem<typeof UNUSED_CREDIT_LINE_ITEM_TYPE>, ReturnType<typeof formatUnusedCredit> {}

function formatUnusedCredit(ctx: HeadlessCheckoutContextInner) {
    const { checkResult, modifiers, currency } = ctx;
    const unusedCredit = checkResult.UnusedCredit ?? 0;

    return {
        /** Unused credit amount */
        amount: unusedCredit,
        currency,
        visible: modifiers.isCustomBilling && unusedCredit < 0,
    };
}

export function createUnusedCreditItem(ctx: HeadlessCheckoutContextInner): UnusedCreditLineItem {
    return {
        type: UNUSED_CREDIT_LINE_ITEM_TYPE,
        ...formatUnusedCredit(ctx),
    };
}
