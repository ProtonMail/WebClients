import { getPlanNameFromIDs } from '@proton/shared/lib/payments/plan/helpers';

import { CYCLE, PLANS } from './constants';
import type { PlanIDs } from './interface';
import { isValidPlanName } from './type-guards';

export function getRenewCycle(plan: PlanIDs | PLANS, selectedCycle: CYCLE): CYCLE {
    const planName = typeof plan === 'string' && isValidPlanName(plan) ? plan : getPlanNameFromIDs(plan);
    if (!planName) {
        return selectedCycle;
    }

    if (
        selectedCycle === CYCLE.TWO_YEARS &&
        [PLANS.MAIL, PLANS.VPN2024, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY].includes(planName)
    ) {
        return CYCLE.YEARLY;
    }

    return selectedCycle;
}
