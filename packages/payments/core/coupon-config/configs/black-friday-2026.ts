import { COUPON_CODES, CYCLE } from '../../constants';
import type { CouponConfigMetadata } from '../interface';

export const blackFriday2026Metadata: CouponConfigMetadata = {
    coupons: [COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE, COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE_CS],
    hidden: true,
    cyclePriceComparePosition: 'before',
    availableCycles: [CYCLE.YEARLY],
    disableCurrencySelector: true,
    hideLumoAddonBanner: true,
    hideMeetAddonBanner: true,
    blockManualEntryOfCoupon: true,
};
