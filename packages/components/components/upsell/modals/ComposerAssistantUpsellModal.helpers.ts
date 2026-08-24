import { type ADDON_NAMES, CYCLE } from '@proton/payments/core/constants';
import type { AmountAndCurrency } from '@proton/payments/core/interface';
import { type MaybeFreeSubscription, getPlanName } from '@proton/payments/core/subscription/helpers';
import type { FullPlansMap } from '@proton/payments/core/subscription/interface';
import { isFreeSubscription } from '@proton/payments/core/type-guards';
import type { Member, Organization } from '@proton/shared/lib/interfaces';
import { isOrganization, isSuperAdmin } from '@proton/shared/lib/organization/helper';

import { B2C_PLANS_SUPPORTING_SCRIBE } from '../../../helpers/assistant';

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
    subscription: MaybeFreeSubscription,
    organization: Organization | undefined,
    member: Member | undefined
) => {
    const isOrgUser = isOrganization(organization) && !isSuperAdmin(member ? [member] : []);

    const planName = isOrgUser ? organization?.PlanName : getPlanName(subscription);
    const isFree = isFreeSubscription(subscription) && !isOrgUser;

    return (planName && B2C_PLANS_SUPPORTING_SCRIBE.includes(planName)) || isFree;
};
