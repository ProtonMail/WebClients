import { addDays, fromUnixTime, isBefore } from 'date-fns';

import { APPS, PLANS } from '@proton/shared/lib/constants';
import { getPlan, isExternal, isTrial } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
}

const isEligible = ({ user, subscription, protonConfig }: Props) => {
    const isValidApp = protonConfig?.APP_NAME === APPS.PROTONMAIL || protonConfig?.APP_NAME === APPS.PROTONACCOUNT;
    const createDate = fromUnixTime(subscription?.CreateTime || subscription?.PeriodStart || 0); // Subscription.CreateTime is not yet available
    const plan = getPlan(subscription);
    return (
        [PLANS.MAIL, PLANS.VPN].includes(plan?.Name as PLANS) &&
        !isTrial(subscription) &&
        isBefore(createDate, addDays(new Date(), -7)) &&
        user.canPay &&
        isValidApp &&
        !user.isDelinquent &&
        !isExternal(subscription)
    );
};

export default isEligible;
