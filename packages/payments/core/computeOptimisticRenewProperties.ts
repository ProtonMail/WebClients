import type { getOptimisticCheckResult } from './checkout';
import { CYCLE, PLANS } from './constants';
import { getPrice } from './price-helpers';
import { SelectedPlan } from './subscription/selected-plan';

export function computeOptimisticRenewProperties(params: Parameters<typeof getOptimisticCheckResult>[0]): {
    BaseRenewAmount: number | null;
    RenewCycle: CYCLE | null;
} | null {
    const selectedPlan = new SelectedPlan(params.planIDs ?? {}, params.plansMap, params.cycle, params.currency);
    const plansWithVariableCycleOffer: PLANS[] = [
        PLANS.MAIL,
        PLANS.VPN2024,
        PLANS.BUNDLE,
        PLANS.DUO,
        PLANS.FAMILY,
        PLANS.VISIONARY,
    ];

    if (plansWithVariableCycleOffer.includes(selectedPlan.getPlanName()) && selectedPlan.cycle > CYCLE.YEARLY) {
        const yearlyPrice = getPrice(selectedPlan.planIDs, CYCLE.YEARLY, params.plansMap);

        return {
            BaseRenewAmount: yearlyPrice,
            RenewCycle: CYCLE.YEARLY,
        };
    }

    return null;
}
