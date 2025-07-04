import { fromUnixTime, isBefore, subDays } from 'date-fns';

import { CYCLE, PLANS, type Subscription, canModify, getPlan, isTrial } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
}

export const getIsEligible = ({ user, subscription, protonConfig }: Props) => {
    const isValidApp = protonConfig?.APP_NAME === APPS.PROTONMAIL || protonConfig?.APP_NAME === APPS.PROTONACCOUNT;
    const createDate = subscription?.CreateTime ? fromUnixTime(subscription.CreateTime) : new Date();
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
    } else if (plan?.Name === PLANS.VPN) {
        return commonConditions;
    }

    return false;
};
