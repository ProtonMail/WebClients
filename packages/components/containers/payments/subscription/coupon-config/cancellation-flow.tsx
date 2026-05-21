import { COUPON_CODES } from '@proton/payments/index';

import type { CouponConfig } from './interface';

export const cancellationFlow: CouponConfig = {
    coupons: [COUPON_CODES.RENEWANDSAVE1M26, COUPON_CODES.RENEWANDSAVE12M26],
    hidden: true,
};
