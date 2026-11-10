import type { CouponConfig } from '@proton/payments-hooks/ui/coupon-config/interface';
import { tryDuo2026Metadata } from '@proton/payments/core/coupon-config/configs/try-duo-2026';

export const tryDuo2026Config: CouponConfig = {
    ...tryDuo2026Metadata,
};
