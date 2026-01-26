import { COUPON_CODES } from '@proton/payments/core/constants';

import type { CouponConfig } from './interface';

export const greenlandIcelandConfig: CouponConfig = {
    coupons: [COUPON_CODES.PLUS12FOR1],
    hidden: true,
    blockManualEntryOfCoupon: true,
    disableCurrencySelector: true,
};
