import Price from '@proton/components/components/price/Price';
import type { CouponConfig } from '@proton/payments-hooks/ui/coupon-config/interface';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { CYCLE } from '@proton/payments/core/constants';
import { monthlyNudgeMetadata } from '@proton/payments/core/coupon-config/configs/monthly-nudge';

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
