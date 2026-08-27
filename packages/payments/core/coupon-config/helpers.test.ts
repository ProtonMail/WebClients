import { hasAlikeCoupon, isCSCoupon } from './helpers';
import type { CouponConfigMetadata } from './interface';

const couponConfig: CouponConfigMetadata = {
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

describe('isCSCoupon', () => {
    it('returns false for undefined coupon', () => {
        expect(isCSCoupon(undefined)).toBe(false);
    });

    it('returns true when coupon code ends with CS', () => {
        expect(isCSCoupon('PROMOCS')).toBe(true);
        expect(isCSCoupon({ Code: 'PROMOCS', Description: '', MaximumRedemptionsPerUser: null })).toBe(true);
    });
});
