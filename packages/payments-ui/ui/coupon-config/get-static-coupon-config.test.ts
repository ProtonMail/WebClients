import { COUPON_CODES } from '@proton/payments/core/constants';
import { blackFriday2026Metadata } from '@proton/payments/core/coupon-config/configs/black-friday-2026';
import { monthlyNudgeMetadata } from '@proton/payments/core/coupon-config/configs/monthly-nudge';

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

    it('does not match configs that rely on special cases instead of coupon codes', () => {
        expect(getStaticCouponConfig('BF25PROMO')).toBeUndefined();
    });
});
