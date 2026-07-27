import { AddonFeatureLimitKeyMapping } from '@proton/payments/core/addon/addons';
import { CYCLE } from '@proton/payments/core/constants';
import type { Currency, FreeSubscription, PlanIDs } from '@proton/payments/core/interface';
import { getPlansWithAddons } from '@proton/payments/core/plan/addons';
import { getPlanNameFromIDs } from '@proton/payments/core/plan/helpers';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import { setQuantity } from '@proton/payments/core/planIDs';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';

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
