import { PLANS } from '@proton/shared/lib/constants';
import { SubscriptionModel, SubscriptionPlan } from '@proton/shared/lib/interfaces';

import { getMailPlusConfig } from './config/mailPlus';
import { PlanConfig } from './interface';

export const getReminderPageConfig = (
    userRewardedDrive: boolean,
    userRewardedMail: boolean,
    subscription?: SubscriptionModel,
    planName?: SubscriptionPlan & { Name: PLANS }
): PlanConfig | null => {
    if (!planName || !subscription) {
        return null;
    }

    if (planName.Name === PLANS.MAIL) {
        return getMailPlusConfig(userRewardedDrive, userRewardedMail, subscription, planName);
    }

    return null;
};
