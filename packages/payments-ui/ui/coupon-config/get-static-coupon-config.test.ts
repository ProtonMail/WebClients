import { COUPON_CODES } from '@proton/payments/core/constants';

import { getStaticCouponConfig } from './get-static-coupon-config';
import { monthlyNudgeConfig } from './monthlyNudge';
import { q3Sale2026Config } from './q3Sale2026';

describe('getStaticCouponConfig', () => {
    it('returns undefined for an unknown coupon', () => {
        expect(getStaticCouponConfig('NONEXISTENT_COUPON')).toBeUndefined();
    });

    it('returns undefined for an empty coupon after trim', () => {
        expect(getStaticCouponConfig('   ')).toBeUndefined();
    });

    it('matches monthlyNudge config by coupon code', () => {
        const result = getStaticCouponConfig(COUPON_CODES.ANNUALOFFER25);

        expect(result).toBe(monthlyNudgeConfig);
        expect(result?.hidden).toBe(true);
    });

    it('normalizes coupon code before matching', () => {
        expect(getStaticCouponConfig('  annualoffer25  ')).toBe(monthlyNudgeConfig);
    });

    it('matches q3Sale2026 config coupons', () => {
        expect(getStaticCouponConfig(COUPON_CODES.SEP26BUNDLESALE)).toBe(q3Sale2026Config);
        expect(getStaticCouponConfig(COUPON_CODES.SEP26BUNDLEDEAL)).toBe(q3Sale2026Config);
        expect(getStaticCouponConfig(COUPON_CODES.SEP26BUNDLESALECS)).toBe(q3Sale2026Config);
        expect(getStaticCouponConfig(COUPON_CODES.SEP26BUNDLEDEALCS)).toBe(q3Sale2026Config);
        expect(getStaticCouponConfig('sep26bundlesale')).toBe(q3Sale2026Config);
    });

    it('does not match configs that rely on special cases instead of coupon codes', () => {
        expect(getStaticCouponConfig('BF25PROMO')).toBeUndefined();
    });
});
