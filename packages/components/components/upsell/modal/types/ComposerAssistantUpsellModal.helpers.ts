import { B2C_PLANS_SUPPORTING_SCRIBE } from '@proton/components/helpers/assistant';
import { type ADDON_NAMES, type AmountAndCurrency, type FullPlansMap, isFreeSubscription } from '@proton/payments';
import { CYCLE } from '@proton/shared/lib/constants';
import { getPlanName } from '@proton/shared/lib/helpers/subscription';
import type { Member, Organization, Subscription } from '@proton/shared/lib/interfaces';
import { isOrganization, isSuperAdmin } from '@proton/shared/lib/organization/helper';

export const getAIAddonMonthlyPrice = (
    plansMap: FullPlansMap,
    addonPlanName: ADDON_NAMES
): AmountAndCurrency | null => {
    const addonPlan = plansMap[addonPlanName];
    if (!addonPlan) {
        return null;
    }
    const yearlyPrice = addonPlan.Pricing[CYCLE.YEARLY];
    if (!yearlyPrice) {
        return null;
    }
    const monthlyPrice = yearlyPrice / 12;

    return {
        Amount: monthlyPrice,
        Currency: addonPlan.Currency,
    };
};

export const getIsB2CUserAbleToRunScribe = (
    subscription: Subscription | undefined,
    organization: Organization | undefined,
    member: Member | undefined
) => {
    const isOrgUser = isOrganization(organization) && !isSuperAdmin(member ? [member] : []);

    const planName = isOrgUser ? organization?.PlanName : getPlanName(subscription);
    const isFree = isFreeSubscription(subscription) && !isOrgUser;

    return (planName && B2C_PLANS_SUPPORTING_SCRIBE.includes(planName)) || isFree;
};
