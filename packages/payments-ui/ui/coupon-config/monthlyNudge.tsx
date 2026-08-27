import Price from '@proton/components/components/price/Price';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { CYCLE } from '@proton/payments/core/constants';
import { monthlyNudgeMetadata } from '@proton/payments/core/coupon-config/configs/monthly-nudge';

import type { CouponConfig } from './interface';

export const monthlyNudgeConfig: CouponConfig = {
    ...monthlyNudgeMetadata,
    cyclePriceCompare: ({ cycle, suffix }, config) => {
        if (cycle !== CYCLE.YEARLY) {
            return null;
        }

        const checkout = getCheckoutUi(config);

        return (
            <Price className="ml-2 text-strike" currency={checkout.currency} suffix={suffix}>
                {checkout.withoutDiscountPerMonth}
            </Price>
        );
    },
    cycleTitle: undefined,
};
