import type { CouponConfig } from '@proton/payments-hooks/ui/coupon-config/interface';
import { cancellationFlowMetadata } from '@proton/payments/core/coupon-config/configs/cancellation-flow';

export const cancellationFlow: CouponConfig = {
    ...cancellationFlowMetadata,
};
