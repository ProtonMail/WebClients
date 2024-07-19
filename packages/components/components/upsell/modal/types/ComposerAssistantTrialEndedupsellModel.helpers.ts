import type { ADDON_NAMES } from '@proton/shared/lib/constants';
import { CYCLE } from '@proton/shared/lib/constants';
import type { Plan } from '@proton/shared/lib/interfaces';

export const getAIAddonMonthlyPrice = (plans: Plan[], addonPlanName: ADDON_NAMES) => {
    const addonPlan = plans?.find((plan) => plan.Name === addonPlanName);
    if (!addonPlan) {
        return;
    }
    const yearlyPrice = addonPlan.Pricing[CYCLE.YEARLY];
    if (!yearlyPrice) {
        return;
    }
    const monthlyPrice = yearlyPrice / 12;

    return monthlyPrice;
};
