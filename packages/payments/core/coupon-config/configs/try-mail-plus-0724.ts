import { COUPON_CODES, CYCLE } from '../../constants';
import type { CouponConfigMetadata } from '../interface';

export const tryMailPlus0724Metadata: CouponConfigMetadata = {
    coupons: COUPON_CODES.TRYMAILPLUS0724,
    hidden: false,
    availableCycles: [CYCLE.MONTHLY],
    hideLumoAddonBanner: true,
    hideMeetAddonBanner: true,
};
