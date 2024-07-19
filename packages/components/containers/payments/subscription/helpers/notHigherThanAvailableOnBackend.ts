import type { CYCLE } from '@proton/shared/lib/constants';
import { getPlanFromIds } from '@proton/shared/lib/helpers/subscription';
import type { PlanIDs, PlansMap } from '@proton/shared/lib/interfaces';

export function notHigherThanAvailableOnBackend(planIDs: PlanIDs, plansMap: PlansMap, cycle: CYCLE): CYCLE {
    const planID = getPlanFromIds(planIDs);
    if (!planID) {
        return cycle;
    }

    const plan = plansMap[planID];
    if (!plan) {
        return cycle;
    }

    const availableCycles = Object.keys(plan.Pricing) as unknown as CYCLE[];
    const maxCycle = Math.max(...availableCycles) as CYCLE;
    return Math.min(cycle, maxCycle);
}
