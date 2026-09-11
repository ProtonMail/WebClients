import { COUPON_CODES, CYCLE } from '../../constants';
import type { CouponConfigMetadata } from '../interface';

export const tryDuo2026Metadata: CouponConfigMetadata = {
    coupons: COUPON_CODES.TRYDUO2026,
    hidden: true,
    cyclePriceComparePosition: 'before',
    availableCycles: [CYCLE.YEARLY],
    disableCurrencySelector: true,
    blockManualEntryOfCoupon: true,
};
