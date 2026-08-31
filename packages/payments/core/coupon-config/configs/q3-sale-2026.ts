import { COUPON_CODES, CYCLE } from '../../constants';
import type { CouponConfigMetadata } from '../interface';

export const q3Sale2026Metadata: CouponConfigMetadata = {
    coupons: [
        COUPON_CODES.SEP26BUNDLESALE,
        COUPON_CODES.SEP26BUNDLEDEAL,
        COUPON_CODES.SEP26BUNDLESALECS,
        COUPON_CODES.SEP26BUNDLEDEALCS,
    ],
    hidden: true,
    cyclePriceComparePosition: 'before',
    availableCycles: [CYCLE.YEARLY],
    disableCurrencySelector: true,
    hideLumoAddonBanner: true,
    hideMeetAddonBanner: true,
    blockManualEntryOfCoupon: true,
};
