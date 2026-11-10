import type { CouponConfig } from '@proton/payments-hooks/ui/coupon-config/interface';
import { porkbunMetadata } from '@proton/payments/core/coupon-config/configs/porkbun';

export const porkbunConfig: CouponConfig = {
    ...porkbunMetadata,
};
