import { fromUnixTime, isBefore } from 'date-fns';

import { APPS, CYCLE, PLANS } from '@proton/shared/lib/constants';
import { getPlan, hasBlackFridayDiscount, isExternal, isTrial } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';

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
    return (
        ((user.isFree && isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT)) ||
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
