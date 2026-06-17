import { COUPON_CODES } from '../../core/constants';

import type { CouponConfig } from './interface';

export const cancellationFlow: CouponConfig = {
    coupons: [COUPON_CODES.RENEWANDSAVE1M26, COUPON_CODES.RENEWANDSAVE12M26],
    hidden: true,
};
