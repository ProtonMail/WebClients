import { defaultCouponConfigs } from './default-coupon-configs';
import type { CouponConfig } from './interface';

/**
 * This function is helpful when you need a certain coupon config before the coupon is actually applied.
 */
export const getStaticCouponConfig = (coupon: string): CouponConfig | undefined => {
    const uppercaseCoupon = coupon.trim().toUpperCase();

    const config = defaultCouponConfigs.find((it) => {
        if (Array.isArray(it.coupons)) {
            return it.coupons.includes(uppercaseCoupon);
        }
        return it.coupons === uppercaseCoupon;
    });

    return config;
};
