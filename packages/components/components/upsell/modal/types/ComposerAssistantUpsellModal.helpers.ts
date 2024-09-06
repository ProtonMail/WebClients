import { type AmountAndCurrency, type FullPlansMap } from '@proton/components/payments/core';
import type { ADDON_NAMES } from '@proton/shared/lib/constants';
import { CYCLE, PLANS, isFreeSubscription } from '@proton/shared/lib/constants';
import { getPlanName } from '@proton/shared/lib/helpers/subscription';
import type { Member, Organization, Subscription } from '@proton/shared/lib/interfaces';
import { isOrganization, isSuperAdmin } from '@proton/shared/lib/organization/helper';

const B2C_PLANS_ABLE_TO_RUN_SCRIBE = [
    PLANS.FREE,
    PLANS.MAIL,
    PLANS.VPN,
    PLANS.DRIVE,
    PLANS.WALLET,
    PLANS.BUNDLE,
    PLANS.VPN2024,
    PLANS.PASS,
    PLANS.VPN_PASS_BUNDLE,
];

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

    return (planName && B2C_PLANS_ABLE_TO_RUN_SCRIBE.includes(planName)) || isFree;
};
