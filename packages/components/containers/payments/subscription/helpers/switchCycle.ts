import type { Currency, Cycle, FreeSubscription, FullPlansMap, PlanIDs, Subscription } from '@proton/payments/index';

import { getAllowedCycles } from './getAllowedCycles';

export const switchCycle = ({
    preferredCycle,
    selectedPlanIDs,
    currency,
    subscription,
    plansMap,
}: {
    preferredCycle: Cycle;
    selectedPlanIDs: PlanIDs;
    currency: Currency;
    subscription: Subscription | FreeSubscription;
    plansMap: FullPlansMap;
}) => {
    const allowedCycles = getAllowedCycles({
        subscription,
        planIDs: selectedPlanIDs,
        plansMap: plansMap,
        currency,
    });

    return allowedCycles.includes(preferredCycle) ? preferredCycle : allowedCycles[0];
};
