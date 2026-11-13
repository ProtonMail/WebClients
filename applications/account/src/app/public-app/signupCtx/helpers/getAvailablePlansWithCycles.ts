import type { Cycle, PlanIDs } from '@proton/payments/core/interface';

import type { AvailablePlan } from '../state-machine/signupActors';

const getAvailablePlansWithCycles = (plans: { planIDs: PlanIDs }[], cycles: Cycle[]): AvailablePlan[] => {
    const availablePlans: AvailablePlan[] = [];

    cycles.forEach((cycle) => {
        plans.forEach((plan) => {
            availablePlans.push({ ...plan, cycle });
        });
    });

    return availablePlans;
};

export default getAvailablePlansWithCycles;
