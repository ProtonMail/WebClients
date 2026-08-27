import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const PRORATION_LINE_ITEM_TYPE = 'proration' as const;

export interface ProrationLineItem
    extends BaseLineItem<typeof PRORATION_LINE_ITEM_TYPE>, ReturnType<typeof formatProration> {}

function formatProration(ctx: HeadlessCheckoutContextInner) {
    const { checkResult, modifiers, currency } = ctx;
    const proration = checkResult.Proration ?? 0;

    return {
        /** Proration amount */
        amount: proration,
        /** Whether the proration represents a credit (amount < 0). Not sure if this property is needed. May be removed
         * later. */
        isCredit: proration < 0,
        currency,
        visible: modifiers.isProration && proration !== 0,
    };
}

export function createProrationItem(ctx: HeadlessCheckoutContextInner): ProrationLineItem {
    return {
        type: PRORATION_LINE_ITEM_TYPE,
        ...formatProration(ctx),
    };
}
