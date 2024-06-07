import { ADDON_NAMES, CYCLE } from '@proton/shared/lib/constants';
import { Plan } from '@proton/shared/lib/interfaces';

export const getAIAddonMonthlyPrice = (plans: Plan[]) => {
    const addonPlan = plans?.find((plan) => plan.Name === ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS);
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
