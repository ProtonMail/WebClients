import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const CREDIT_LINE_ITEM_TYPE = 'credit' as const;

export interface CreditLineItem extends BaseLineItem<typeof CREDIT_LINE_ITEM_TYPE>, ReturnType<typeof formatCredit> {}

function formatCredit(ctx: HeadlessCheckoutContextInner) {
    const { checkResult, currency } = ctx;
    const credit = checkResult.Credit ?? 0;

    return {
        /** Credit amount. Positive = added to balance, negative = subtracted. */
        amount: credit,
        /** Whether credit is being added to the account balance. Credits can be added in case if the proration amount is
         * higher than the new subscription amount. In that case the rest of the unused subscription is "refunded" as
         * credits, and will later be consumed for renewals. */
        isAddedToBalance: credit > 0,
        currency,
        visible: credit !== 0,
    };
}

export function createCreditItem(ctx: HeadlessCheckoutContextInner): CreditLineItem {
    return {
        type: CREDIT_LINE_ITEM_TYPE,
        ...formatCredit(ctx),
    };
}
