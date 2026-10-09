import { COUPON_CODES } from '../constants';
import { blackFriday2026Metadata } from './configs/black-friday-2026';
import { monthlyNudgeMetadata } from './configs/monthly-nudge';
import { porkbunMetadata } from './configs/porkbun';
import { tryDuo2026Metadata } from './configs/try-duo-2026';
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

    it('matches blackFriday2026 config coupons', () => {
        expect(getStaticCouponConfig(COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE)).toBe(blackFriday2026Metadata);
        expect(getStaticCouponConfig(COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE_CS)).toBe(blackFriday2026Metadata);
        expect(getStaticCouponConfig('bf26bundlepromo')).toBe(blackFriday2026Metadata);
    });

    it('matches porkbun config by coupon code', () => {
        expect(getStaticCouponConfig(COUPON_CODES.PORKBUN)).toBe(porkbunMetadata);
        expect(getStaticCouponConfig('porkbun')).toBe(porkbunMetadata);
    });

    it('matches tryDuo2026 config by coupon code', () => {
        expect(getStaticCouponConfig(COUPON_CODES.TRYDUO2026)).toBe(tryDuo2026Metadata);
        expect(getStaticCouponConfig('tryduo2026')).toBe(tryDuo2026Metadata);
    });

    it('does not match configs that rely on special cases instead of coupon codes', () => {
        expect(getStaticCouponConfig('BF25PROMO')).toBeUndefined();
    });
});
