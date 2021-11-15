import { Cycle, PlanIDs, PlansMap } from '@proton/shared/lib/interfaces';

export const getSubTotal = (planIDs: PlanIDs, plansMap: PlansMap, cycle: Cycle) => {
    return Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
        const amount = plansMap[planName as keyof PlansMap]?.Pricing?.[cycle] || 0;
        return acc + (quantity || 0) * amount;
    }, 0);
};
