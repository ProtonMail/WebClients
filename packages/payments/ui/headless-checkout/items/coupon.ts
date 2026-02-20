import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const COUPON_LINE_ITEM_TYPE = 'coupon' as const;

export interface CouponLineItem extends BaseLineItem<typeof COUPON_LINE_ITEM_TYPE>, ReturnType<typeof formatCoupon> {}

function formatCoupon(ctx: HeadlessCheckoutContextInner) {
    const { checkResult, couponConfig, currency } = ctx;
    const couponDiscount = checkResult.CouponDiscount ?? 0;

    return {
        couponCode: checkResult.Coupon?.Code ?? null,
        couponDescription: checkResult.Coupon?.Description ?? null,
        discountAmount: couponDiscount,
        currency,
        /**
         * Hidden when `couponConfig.hidden` is set. Business rule: some coupons are applied silently and should not
         * appear as a separate line item.
         */
        visible: couponDiscount !== 0 && !couponConfig?.hidden,
    };
}

export function createCouponItem(ctx: HeadlessCheckoutContextInner): CouponLineItem {
    return {
        type: COUPON_LINE_ITEM_TYPE,
        ...formatCoupon(ctx),
    };
}
