import { type PLANS, PLAN_NAMES, getHasSomeDrivePlusPlan } from '@proton/payments';
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';

export const getPlusTitle = (appName: string) => {
    return `${appName} Plus`;
};

export const getNormalizedPlanTitleToPlus = (planName: PLANS) => {
    // Drive is called `Drive Plus 200 GB` but in some cases we just want to call it `Drive Plus`
    if (getHasSomeDrivePlusPlan(planName)) {
        return getPlusTitle(DRIVE_SHORT_APP_NAME);
    }
    return PLAN_NAMES[planName];
};
