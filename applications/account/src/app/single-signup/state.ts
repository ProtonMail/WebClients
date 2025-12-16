import type { PLANS, Plan } from '@proton/payments';
import { CYCLE, type Currency, FREE_PLAN, getIsVPNPassPromotion } from '@proton/payments';

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
