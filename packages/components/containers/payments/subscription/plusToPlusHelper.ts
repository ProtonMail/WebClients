import {
    type ADDON_NAMES,
    type PLANS,
    PLAN_NAMES,
    type Plan,
    type SubscriptionPlan,
    getHasSomeDrivePlusPlan,
    isValidPlanName,
} from '@proton/payments';
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';

export const getPlusTitle = (appName: string) => {
    return `${appName} Plus`;
};

export const getNormalizedPlanTitleToPlus = (planName: PLANS | ADDON_NAMES) => {
    // Drive is called `Drive Plus 200 GB` but in some cases we just want to call it `Drive Plus`
    if (getHasSomeDrivePlusPlan(planName)) {
        return getPlusTitle(DRIVE_SHORT_APP_NAME);
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
