import { fromUnixTime, isBefore } from 'date-fns';

import { APPS } from '@proton/shared/lib/constants';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    lastSubscriptionEnd?: number;
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
}

const isEligible = ({ user, subscription, protonConfig, lastSubscriptionEnd = 0 }: Props) => {
    const isValidApp =
        protonConfig?.APP_NAME === APPS.PROTONMAIL ||
        protonConfig?.APP_NAME === APPS.PROTONACCOUNT ||
        protonConfig?.APP_NAME === APPS.PROTONACCOUNTLITE;
    const aMonthAgo = new Date();
    aMonthAgo.setMonth(aMonthAgo.getMonth() - 1);
    const sinceAMonth = isBefore(fromUnixTime(lastSubscriptionEnd), aMonthAgo);
    return (
        ((user?.isFree && sinceAMonth) || isTrial(subscription)) && user?.canPay && !user?.isDelinquent && isValidApp
    );
};

export default isEligible;
