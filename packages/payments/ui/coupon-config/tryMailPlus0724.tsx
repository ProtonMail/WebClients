import { COUPON_CODES, CYCLE } from '../../core/constants';
import type { CouponConfig } from './interface';

// Hide distractions for users checking out with the Mail Plus intro pricing coupon
export const tryMailPlus0724Config: CouponConfig = {
    coupons: COUPON_CODES.TRYMAILPLUS0724,
    hidden: false,
    availableCycles: [CYCLE.MONTHLY],
    hideLumoAddonBanner: true,
    hideMeetAddonBanner: true,
};
