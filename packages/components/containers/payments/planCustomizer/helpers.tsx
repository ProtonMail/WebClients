import type { FreeSubscription } from '@proton/payments';
import {
    AddonFeatureLimitKeyMapping,
    CYCLE,
    type Currency,
    type PlanIDs,
    type PlansMap,
    SelectedPlan,
    type Subscription,
    getPlanNameFromIDs,
    getPlansWithAddons,
    setQuantity,
} from '@proton/payments';

import { getForcedFeatureLimitations } from './forced-addon-limits';

export const getHasPlanCustomizer = (planIDs: PlanIDs) => {
    const planName = getPlanNameFromIDs(planIDs);
    if (!planName) {
        return false;
    }

    return getPlansWithAddons().includes(planName);
};

export function forceAddonsMinMaxConstraints({
    selectedPlanIDs,
    plansMap,
    currency,
    subscription,
}: {
    selectedPlanIDs: PlanIDs;
    plansMap: PlansMap;
    currency: Currency;
    subscription: Subscription | FreeSubscription | undefined;
}): PlanIDs | undefined {
    const normalizedSelectedPlan = SelectedPlan.createNormalized(
        selectedPlanIDs,
        plansMap,
        // cycle doesn't matter here
        CYCLE.MONTHLY,
        currency
    );

    const addons = normalizedSelectedPlan.getSupportedAddonNames();

    let newPlanIDs: PlanIDs | undefined;
    for (const addonName of addons) {
        const featureLimitKey = AddonFeatureLimitKeyMapping[addonName];
        const { forcedMin, forcedMax } = getForcedFeatureLimitations({
            plan: normalizedSelectedPlan.getPlanName(),
            featureLimitKey,
            subscription,
            plansMap,
        });

        let newTarget: number | undefined;
        if (forcedMin && normalizedSelectedPlan.getTotal(featureLimitKey) < forcedMin) {
            newTarget = forcedMin;
        } else if (forcedMax && normalizedSelectedPlan.getTotal(featureLimitKey) > forcedMax) {
            newTarget = forcedMax;
        }

        if (newTarget) {
            newPlanIDs = setQuantity(
                newPlanIDs ?? normalizedSelectedPlan.planIDs,
                addonName,
                newTarget - normalizedSelectedPlan.getTotal(featureLimitKey)
            );
        }
    }

    return newPlanIDs;
}

export type DecreaseBlockedReason = 'forbidden-modification';

export type IncreaseBlockedReason = 'trial-limit';
