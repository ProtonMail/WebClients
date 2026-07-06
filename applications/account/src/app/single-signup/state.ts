import { CYCLE, type PLANS } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import type { Plan } from '@proton/payments/core/plan/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getIsVPNPassPromotion } from '@proton/payments/core/subscription/helpers';

import type { CycleData } from './interface';

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

export const filterCycleDataByPlan = (cycleData: CycleData, plan: Plan): CycleData => {
    if (plan.Name === FREE_PLAN.Name) {
        return cycleData;
    }

    const supportedCycles = cycleData.cycles.filter((cycle) => plan.Pricing && plan.Pricing[cycle] !== undefined);

    if (supportedCycles.length === 0) {
        return cycleData;
    }

    const upsellCycle = supportedCycles.includes(cycleData.upsellCycle)
        ? cycleData.upsellCycle
        : Math.max(...supportedCycles);

    return {
        cycles: supportedCycles,
        upsellCycle,
    };
};
