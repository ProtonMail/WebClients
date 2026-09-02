import { COUPON_CODES } from '../constants';
import { monthlyNudgeMetadata } from './configs/monthly-nudge';
import { porkbunMetadata } from './configs/porkbun';
import { q3Sale2026Metadata } from './configs/q3-sale-2026';
import { getStaticCouponConfig } from './get-static-coupon-config';

describe('getStaticCouponConfig', () => {
    it('returns undefined for an unknown coupon', () => {
        expect(getStaticCouponConfig('NONEXISTENT_COUPON')).toBeUndefined();
    });

    it('returns undefined for an empty coupon after trim', () => {
        expect(getStaticCouponConfig('   ')).toBeUndefined();
    });

    it('matches monthlyNudge config by coupon code', () => {
        const result = getStaticCouponConfig(COUPON_CODES.ANNUALOFFER25);

        expect(result).toBe(monthlyNudgeMetadata);
        expect(result?.hidden).toBe(true);
    });

    it('normalizes coupon code before matching', () => {
        expect(getStaticCouponConfig('  annualoffer25  ')).toBe(monthlyNudgeMetadata);
    });

    it('matches q3Sale2026 config coupons', () => {
        expect(getStaticCouponConfig(COUPON_CODES.SEP26BUNDLESALE)).toBe(q3Sale2026Metadata);
        expect(getStaticCouponConfig(COUPON_CODES.SEP26BUNDLEDEAL)).toBe(q3Sale2026Metadata);
        expect(getStaticCouponConfig(COUPON_CODES.SEP26BUNDLESALECS)).toBe(q3Sale2026Metadata);
        expect(getStaticCouponConfig(COUPON_CODES.SEP26BUNDLEDEALCS)).toBe(q3Sale2026Metadata);
        expect(getStaticCouponConfig('sep26bundlesale')).toBe(q3Sale2026Metadata);
    });

    it('matches porkbun config by coupon code', () => {
        expect(getStaticCouponConfig(COUPON_CODES.PORKBUN)).toBe(porkbunMetadata);
        expect(getStaticCouponConfig('porkbun')).toBe(porkbunMetadata);
    });

    it('does not match configs that rely on special cases instead of coupon codes', () => {
        expect(getStaticCouponConfig('BF25PROMO')).toBeUndefined();
    });
});
