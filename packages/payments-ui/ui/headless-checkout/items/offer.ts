import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const OFFER_LINE_ITEM_TYPE = 'offer' as const;

export interface OfferLineItem extends BaseLineItem<typeof OFFER_LINE_ITEM_TYPE>, ReturnType<typeof formatOffer> {}

function formatOffer(ctx: HeadlessCheckoutContextInner) {
    const { checkResult, checkoutUi, currency, hasOffer } = ctx;

    return {
        offerCode: checkResult.OfferName ?? null,
        offerDescription: checkResult.OfferDescription ?? null,
        discountAmount: checkoutUi.offerDiscount ?? 0,
        discountPercent: hasOffer ? checkoutUi.discountPercent : 0,
        currency,
        visible: hasOffer,
    };
}

export function createOfferItem(ctx: HeadlessCheckoutContextInner): OfferLineItem {
    return {
        type: OFFER_LINE_ITEM_TYPE,
        ...formatOffer(ctx),
    };
}
