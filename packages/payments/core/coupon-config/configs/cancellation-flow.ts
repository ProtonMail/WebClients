import { COUPON_CODES } from '../../constants';
import type { CouponConfigMetadata } from '../interface';

export const cancellationFlowMetadata: CouponConfigMetadata = {
    coupons: [COUPON_CODES.RENEWANDSAVE1M26, COUPON_CODES.RENEWANDSAVE12M26],
    hidden: true,
};
