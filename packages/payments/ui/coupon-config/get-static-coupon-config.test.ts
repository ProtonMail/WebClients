import { COUPON_CODES } from '../../core/constants';
import { getStaticCouponConfig } from './get-static-coupon-config';
import { monthlyNudgeConfig } from './monthlyNudge';
import { summerSale2026Config } from './summerSale2026';
import { summerSale2026BundleConfig } from './summerSale2026bundle';

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

    it('matches summerSale2026 config coupons', () => {
        expect(getStaticCouponConfig(COUPON_CODES.JUNE26SALE)).toBe(summerSale2026Config);
        expect(getStaticCouponConfig(COUPON_CODES.MAR26SALECS)).toBe(summerSale2026Config);
        expect(getStaticCouponConfig('june26sale')).toBe(summerSale2026Config);
    });

    it('matches summerSale2026Bundle config coupons', () => {
        expect(getStaticCouponConfig(COUPON_CODES.JUNE26BUNDLESALE)).toBe(summerSale2026BundleConfig);
        expect(getStaticCouponConfig(COUPON_CODES.MAR26BUNDLESALECS)).toBe(summerSale2026BundleConfig);
    });

    it('does not match configs that rely on special cases instead of coupon codes', () => {
        expect(getStaticCouponConfig('BF25PROMO')).toBeUndefined();
    });
});
