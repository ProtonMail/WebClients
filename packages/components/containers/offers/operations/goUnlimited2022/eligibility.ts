import { fromUnixTime, isBefore, subDays } from 'date-fns';

import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { type MaybeFreeSubscription, canModify, getPlan, isTrial } from '@proton/payments/core/subscription/helpers';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';

interface Props {
    user: UserModel;
    subscription: MaybeFreeSubscription;
    multiSubscriptionContext: MultiSubscriptionContext;
    protonConfig: ProtonConfig;
}

export const getIsEligible = ({ user, subscription, multiSubscriptionContext, protonConfig }: Props) => {
    const isValidApp = protonConfig?.APP_NAME === APPS.PROTONMAIL || protonConfig?.APP_NAME === APPS.PROTONACCOUNT;
    const createDate =
        isPaidSubscription(subscription) && subscription.CreateTime
            ? fromUnixTime(subscription.CreateTime)
            : new Date();
    const plan = getPlan(subscription);

    const commonConditions =
        !isTrial(subscription) &&
        isBefore(createDate, subDays(new Date(), 7)) &&
        user.canPay &&
        isValidApp &&
        !user.isDelinquent &&
        canModify(multiSubscriptionContext);

    if (plan?.Name === PLANS.MAIL) {
        const isMonthly = subscription?.Cycle === CYCLE.MONTHLY;
        return commonConditions && !isMonthly;
    } else if (plan?.Name === PLANS.VPN || plan?.Name === PLANS.VPN2024) {
        return commonConditions;
    }

    return false;
};
