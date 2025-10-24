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
import { POST_SIGNUP_GO_UNLIMITED_ACCOUNT_AGE } from './interface';

interface EligiblityProps {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    parentApp?: (typeof APPS)[keyof typeof APPS];
}

export const getIsEligible = ({ user, subscription, protonConfig, parentApp }: EligiblityProps) => {
    return checksAllPass(
        hasSubscription(subscription),
        isWebSubscription(subscription),
        hasNoScheduledSubscription(subscription),
        userCanPay(user),
        userNotDelinquent(user),
        noPassLifetime(user),
        checkAppIsValid([APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE], protonConfig, parentApp),
        checkPlanIsValid([PLANS.MAIL, PLANS.DRIVE], subscription),
        checkCycleIsValid([CYCLE.YEARLY, CYCLE.TWO_YEARS], subscription),
        checkTimeSubscribedIsValid(POST_SIGNUP_GO_UNLIMITED_ACCOUNT_AGE, subscription)
    );
};
