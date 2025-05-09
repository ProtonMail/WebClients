import { CYCLE, type Cycle, PLANS, type PlanIDs, type PlansMap } from '@proton/payments';
import { type Currency } from '@proton/payments';
import { getCheckout, getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';

// This is currently hardcoded. Once the payments backend supports renewals at different cycles,
// it will be changed to more generic code. Currently there is no way to tell which plan renews at which cycle,
// so we have to hardcode it.
export const isSpecialRenewPlan = (planIDs: PlanIDs) => !!planIDs[PLANS.VPN2024];

const getRenewCycle = (cycle: Cycle, planIDs: PlanIDs): CYCLE => {
    if (!isSpecialRenewPlan(planIDs)) {
        return cycle;
    }

    if (cycle === CYCLE.MONTHLY || cycle === CYCLE.THREE || cycle === CYCLE.YEARLY) {
        return cycle;
    }
    // 15,24,30 all renew at yearly.
    return CYCLE.YEARLY;
};

export const getOptimisticRenewCycleAndPrice = ({
    planIDs,
    plansMap,
    cycle,
    currency,
    renewAmount,
    renewCycle,
}: {
    cycle: Cycle;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    currency: Currency;
    renewAmount?: number | null;
    renewCycle?: CYCLE | null;
}): {
    renewPrice: number;
    renewalLength: CYCLE;
} => {
    if (!!renewAmount && !!renewCycle) {
        return {
            renewPrice: renewAmount,
            renewalLength: renewCycle,
        };
    }

    const nextCycle = getRenewCycle(cycle, planIDs);
    const latestCheckout = getCheckout({
        plansMap,
        planIDs,
        checkResult: getOptimisticCheckResult({
            planIDs,
            plansMap,
            cycle: nextCycle,
            currency,
        }),
    });

    return {
        // The API doesn't return the correct next cycle or RenewAmount for the VPN plan since we don't have chargebee
        // So we calculate it with the cycle discount here
        renewPrice: latestCheckout.withDiscountPerCycle,
        renewalLength: nextCycle,
    };
};
