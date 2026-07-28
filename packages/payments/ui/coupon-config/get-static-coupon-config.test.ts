import { COUPON_CODES } from '../../core/constants';
import { getStaticCouponConfig } from './get-static-coupon-config';
import { monthlyNudgeConfig } from './monthlyNudge';

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

    it('does not match configs that rely on special cases instead of coupon codes', () => {
        expect(getStaticCouponConfig('BF25PROMO')).toBeUndefined();
    });
});
