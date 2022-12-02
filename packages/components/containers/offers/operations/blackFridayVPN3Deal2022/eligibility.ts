import { fromUnixTime, isBefore } from 'date-fns';

import { APPS, CYCLE, PLANS } from '@proton/shared/lib/constants';
import { getPlan, hasBlackFridayDiscount, isExternal, isTrial } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    lastSubscriptionEnd?: number;
}

const isEligible = ({ user, subscription, protonConfig, lastSubscriptionEnd = 0 }: Props) => {
    const plan = getPlan(subscription);
    const noBF = !hasBlackFridayDiscount(subscription);
    const isVpnApp = protonConfig.APP_NAME === APPS.PROTONVPN_SETTINGS;
    const aMonthAgo = new Date();
    aMonthAgo.setMonth(aMonthAgo.getMonth() - 1);
    const sinceAMonth = isBefore(fromUnixTime(lastSubscriptionEnd), aMonthAgo);
    return (
        ((user.isFree && sinceAMonth) ||
            isTrial(subscription) ||
            (plan?.Name === PLANS.VPN && subscription?.Cycle === CYCLE.MONTHLY && !user.hasPaidMail)) &&
        noBF &&
        user.canPay &&
        isVpnApp &&
        !user.isDelinquent &&
        !isExternal(subscription)
    );
};

export default isEligible;
