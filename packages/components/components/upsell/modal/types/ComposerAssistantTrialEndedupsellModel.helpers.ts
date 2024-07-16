import { ADDON_NAMES, CYCLE } from '@proton/shared/lib/constants';
import { Plan } from '@proton/shared/lib/interfaces';

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
