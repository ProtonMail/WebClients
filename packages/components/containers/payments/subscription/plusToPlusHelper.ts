import { type ADDON_NAMES, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { getHasSomeDrivePlusPlan } from '@proton/payments/core/plan/helpers';
import type { Plan, SubscriptionPlan } from '@proton/payments/core/plan/interface';
import { isValidPlanName } from '@proton/payments/core/type-guards';
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';

export const getPlusTitle = (appName: string) => {
    return `${appName} Plus`;
};

export const getNormalizedPlanTitleToPlus = (planName: PLANS | ADDON_NAMES) => {
    // Drive is called `Drive Plus 200 GB` but in some cases we just want to call it `Drive Plus`
    if (getHasSomeDrivePlusPlan(planName)) {
        return getPlusTitle(DRIVE_SHORT_APP_NAME);
    }
    if (planName === PLANS.PASS_LIFETIME) {
        return PLAN_NAMES[PLANS.PASS];
    }
    return isValidPlanName(planName) ? PLAN_NAMES[planName] : '';
};

export const getNormalizedPlanTitles = ({
    currentPlan,
    upsellPlan,
    unlockPlan,
}: {
    currentPlan: SubscriptionPlan | undefined;
    upsellPlan: Plan | undefined;
    unlockPlan: Plan | undefined;
}) => {
    const currentPlanTitle =
        (currentPlan?.Name ? getNormalizedPlanTitleToPlus(currentPlan?.Name) : currentPlan?.Title) || '';
    const unlockPlanTitle =
        (unlockPlan?.Name ? getNormalizedPlanTitleToPlus(unlockPlan?.Name) : unlockPlan?.Title) || '';
    const upsellPlanTitle =
        (upsellPlan?.Name ? getNormalizedPlanTitleToPlus(upsellPlan?.Name) : upsellPlan?.Title) || '';
    return {
        currentPlanTitle,
        unlockPlanTitle,
        upsellPlanTitle,
    };
};
