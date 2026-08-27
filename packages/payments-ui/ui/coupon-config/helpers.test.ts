import { hasAlikeCoupon } from './helpers';
import type { CouponConfig } from './interface';

const couponConfig: CouponConfig = {
    coupons: ['BF2025', 'BF2025_1M'],
    hidden: false,
};

describe('hasAlikeCoupon', () => {
    it('should return false if coupon config is undefined', () => {
        expect(hasAlikeCoupon(undefined, { Code: 'TEST', Description: '', MaximumRedemptionsPerUser: null })).toBe(
            false
        );
    });

    it('should return false if coupon is undefined', () => {
        expect(hasAlikeCoupon(couponConfig, undefined)).toBe(false);
    });

    it('should return true if coupon is the same as any of the coupon config', () => {
        expect(hasAlikeCoupon(couponConfig, { Code: 'BF2025', Description: '', MaximumRedemptionsPerUser: null })).toBe(
            true
        );
        expect(
            hasAlikeCoupon(couponConfig, { Code: 'BF2025_1M', Description: '', MaximumRedemptionsPerUser: null })
        ).toBe(true);
    });

    it('should return true if coupon is like any of the coupon config', () => {
        expect(
            hasAlikeCoupon(couponConfig, { Code: 'BF2025_CS', Description: '', MaximumRedemptionsPerUser: null })
        ).toBe(true);

        expect(
            hasAlikeCoupon(couponConfig, { Code: 'BF2025_1M_CS', Description: '', MaximumRedemptionsPerUser: null })
        ).toBe(true);
    });
});
