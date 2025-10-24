import { CYCLE, PLANS, type Subscription } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import {
    checkAppIsValid,
    checkCycleIsValid,
    checkPlanIsValid,
    checkTimeSubscribedIsValid,
    checksAllPass,
    hasNoScheduledSubscription,
    hasSubscription,
    isWebSubscription,
    noPassLifetime,
    userCanPay,
    userNotDelinquent,
} from '../../common/helpers/eligibilityChecks';
import { MINIMUM_DAYS_SUBSCRIBED_TO_UNLIMITED } from './interface';

interface EligibilityProps {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    parentApp?: (typeof APPS)[keyof typeof APPS];
}

export const getIsEligible = ({ user, subscription, protonConfig, parentApp }: EligibilityProps) => {
    return checksAllPass(
        userCanPay(user),
        userNotDelinquent(user),
        noPassLifetime(user),
        hasSubscription(subscription),
        isWebSubscription(subscription),
        hasNoScheduledSubscription(subscription),
        checkAppIsValid([APPS.PROTONMAIL, APPS.PROTONDRIVE], protonConfig, parentApp),
        checkCycleIsValid([CYCLE.YEARLY, CYCLE.TWO_YEARS], subscription),
        checkPlanIsValid([PLANS.BUNDLE], subscription),
        checkTimeSubscribedIsValid(MINIMUM_DAYS_SUBSCRIBED_TO_UNLIMITED, subscription)
    );
};
