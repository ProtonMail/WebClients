import { fromUnixTime, isBefore, subDays } from 'date-fns';

import { CYCLE, PLANS, canModify, getPlan, isTrial } from '@proton/payments';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription: MaybeFreeSubscription;
    protonConfig: ProtonConfig;
}

export const getIsEligible = ({ user, subscription, protonConfig }: Props) => {
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
        canModify(subscription);

    if (plan?.Name === PLANS.MAIL) {
        const isMonthly = subscription?.Cycle === CYCLE.MONTHLY;
        return commonConditions && !isMonthly;
    } else if (plan?.Name === PLANS.VPN || plan?.Name === PLANS.VPN2024) {
        return commonConditions;
    }

    return false;
};
