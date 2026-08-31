import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { COUPON_CODES } from './constants';
import { hasLifetimeCoupon } from './coupons';

describe('hasLifetime', () => {
    it('should have LIFETIME', () => {
        const subscription = buildSubscription(undefined, { CouponCode: COUPON_CODES.LIFETIME });

        expect(hasLifetimeCoupon(subscription)).toBe(true);
    });

    it('should not have LIFETIME', () => {
        const subscription = buildSubscription(undefined, { CouponCode: 'PANDA' });

        expect(hasLifetimeCoupon(subscription)).toBe(false);
    });
});
