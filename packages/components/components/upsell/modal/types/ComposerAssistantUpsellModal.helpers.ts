import type { ADDON_NAMES } from '@proton/shared/lib/constants';
import { isFreeSubscription } from '@proton/shared/lib/constants';
import { PLANS } from '@proton/shared/lib/constants';
import { CYCLE } from '@proton/shared/lib/constants';
import { getPlanName } from '@proton/shared/lib/helpers/subscription';
import type { Member, Organization, Plan, Subscription } from '@proton/shared/lib/interfaces';
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
