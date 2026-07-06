import type { Currency, Cycle, FreeSubscription, PlanIDs } from '@proton/payments/core/interface';
import type { FullPlansMap, Subscription } from '@proton/payments/core/subscription/interface';

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
