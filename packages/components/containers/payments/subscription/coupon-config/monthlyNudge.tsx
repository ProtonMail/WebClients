import Price from '@proton/components/components/price/Price';
import { COUPON_CODES, CYCLE } from '@proton/payments';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';

import { type CouponConfig } from './interface';

export const monthlyNudgeConfig: CouponConfig = {
    coupon: COUPON_CODES.ANNUALOFFER25,
    hidden: true,
    cyclePriceCompare: ({ cycle, suffix }, config) => {
        if (cycle !== CYCLE.YEARLY) {
            return null;
        }

        const checkout = getCheckout(config);

        return (
            <Price className="ml-2 text-strike" currency={checkout.currency} suffix={suffix}>
                {checkout.withoutDiscountPerMonth}
            </Price>
        );
    },
    cycleTitle: undefined,
};
