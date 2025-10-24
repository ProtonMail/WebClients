import { CYCLE, PLANS, type Subscription } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import {
    checkAppIsValid,
    checkCycleIsValid,
    checkPlanIsValid,
    checksAllPass,
    hasNoScheduledSubscription,
    hasSubscription,
    isWebSubscription,
    noPassLifetime,
    userCanPay,
    userNotDelinquent,
} from '../../common/helpers/eligibilityChecks';

interface EligibilityProps {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    parentApp?: (typeof APPS)[keyof typeof APPS];
}

// TODO: add eligiblity based on account age and next login. Next ticket.

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
        checkPlanIsValid([PLANS.BUNDLE], subscription)
    );
};
