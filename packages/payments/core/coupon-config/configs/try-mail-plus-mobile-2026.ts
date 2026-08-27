import { COUPON_CODES, CYCLE } from '../../constants';
import type { CouponConfigMetadata } from '../interface';

export const tryMailPlusMobile2026Metadata: CouponConfigMetadata = {
    coupons: COUPON_CODES.TRYMAILPLUSMOBILE2026,
    hidden: false,
    availableCycles: [CYCLE.MONTHLY],
    hideLumoAddonBanner: true,
    hideMeetAddonBanner: true,
};
