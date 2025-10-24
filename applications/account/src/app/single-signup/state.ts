import { getIsVPNPassPromotion } from '@proton/components/containers/payments/subscription/helpers';
import type { PLANS } from '@proton/payments';
import { CYCLE, type Currency } from '@proton/payments';

export const getCycleData = ({ coupon, currency }: { plan: PLANS; coupon?: string; currency: Currency }) => {
    if (getIsVPNPassPromotion(coupon, currency)) {
        return {
            upsellCycle: CYCLE.YEARLY,
            cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
        };
    }

    return {
        upsellCycle: CYCLE.TWO_YEARS,
        cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
    };
};
