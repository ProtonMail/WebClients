import { defaultCouponConfigMetadata } from './default-coupon-configs';
import type { CouponConfigMetadata } from './interface';

/**
 * Returns coupon configuration metadata for a coupon code before it is applied.
 */
export const getStaticCouponConfig = (coupon: string): CouponConfigMetadata | undefined => {
    const uppercaseCoupon = coupon.trim().toUpperCase();

    const config = defaultCouponConfigMetadata.find((it) => {
        if (Array.isArray(it.coupons)) {
            return it.coupons.includes(uppercaseCoupon);
        }
        return it.coupons === uppercaseCoupon;
    });

    return config;
};
