import { COUPON_CODES } from './constants';
import type { MaybeFreeSubscription } from './subscription/interface';

export function hasLifetimeCoupon(subscription: MaybeFreeSubscription) {
    return subscription?.CouponCode === COUPON_CODES.LIFETIME;
}
