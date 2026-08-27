import { COUPON_CODES, CYCLE } from '@proton/payments/core/constants';

import type { CouponConfig } from './interface';

// Hide distractions for users checking out with the Mail Plus mobile intro pricing coupon
export const tryMailPlusMobile2026Config: CouponConfig = {
    coupons: COUPON_CODES.TRYMAILPLUSMOBILE2026,
    hidden: false,
    availableCycles: [CYCLE.MONTHLY],
    hideLumoAddonBanner: true,
    hideMeetAddonBanner: true,
};
