import type { Coupon } from '@proton/payments';

import type { CouponConfig } from './interface';
import type { CouponConfigRendered } from './useCouponConfig';

/**
 * Checks if user selected a similar coupon to what is configured in the coupon config.
 * This is helpful, for example, to check if user entered a CS version of the coupon.
 */
export function hasAlikeCoupon(
    couponConfig: CouponConfig | CouponConfigRendered | undefined,
    coupon: Coupon | undefined
) {
    if (!couponConfig || !coupon?.Code) {
        return false;
    }

    const coupons = Array.isArray(couponConfig.coupons) ? couponConfig.coupons : [couponConfig.coupons];

    return coupons.some((couponStr) => coupon.Code.startsWith(couponStr));
}
