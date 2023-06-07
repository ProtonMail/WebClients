import { fromUnixTime, isBefore } from 'date-fns';

import { APPS } from '@proton/shared/lib/constants';
import { isManagedExternally, isTrial } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    lastSubscriptionEnd?: number;
}

const isEligible = ({ user, subscription, protonConfig, lastSubscriptionEnd = 0 }: Props) => {
    const isValidApp = protonConfig?.APP_NAME === APPS.PROTONMAIL || protonConfig?.APP_NAME === APPS.PROTONCALENDAR;
    const lastSubscriptionEndDate = fromUnixTime(lastSubscriptionEnd); // If there is no previous subscription, lastSubscriptionEnd is 0
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const isFreeSinceAtLeastOneMonth = user.isFree && isBefore(lastSubscriptionEndDate, oneMonthAgo);

    if (!isValidApp) {
        return false;
    }

    if (!user.canPay) {
        return false;
    }

    if (user.isDelinquent) {
        return false;
    }

    if (isManagedExternally(subscription)) {
        return false;
    }

    if (isTrial(subscription)) {
        return true;
    }

    return isFreeSinceAtLeastOneMonth;
};

export default isEligible;
