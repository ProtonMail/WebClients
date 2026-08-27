import { cancellationFlowMetadata } from '@proton/payments/core/coupon-config/configs/cancellation-flow';

import type { CouponConfig } from './interface';

export const cancellationFlow: CouponConfig = {
    ...cancellationFlowMetadata,
};
