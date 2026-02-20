import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const GIFT_LINE_ITEM_TYPE = 'gift' as const;

export interface GiftLineItem extends BaseLineItem<typeof GIFT_LINE_ITEM_TYPE>, ReturnType<typeof formatGift> {}

function formatGift(ctx: HeadlessCheckoutContextInner) {
    const { checkResult, currency } = ctx;
    const giftValue = Math.abs(checkResult.Gift || 0);

    return {
        /** Gift discount amount (always negative) */
        amount: -giftValue,
        currency,
        visible: giftValue > 0,
    };
}

export function createGiftItem(ctx: HeadlessCheckoutContextInner): GiftLineItem {
    return {
        type: GIFT_LINE_ITEM_TYPE,
        ...formatGift(ctx),
    };
}
