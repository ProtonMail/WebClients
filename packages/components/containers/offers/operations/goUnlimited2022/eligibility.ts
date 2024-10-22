import { addDays, fromUnixTime, isBefore } from 'date-fns';

import { PLANS } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { getPlan, isManagedExternally, isTrial } from '@proton/shared/lib/helpers/subscription';
import type { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
}

const isEligible = ({ user, subscription, protonConfig }: Props) => {
    const isValidApp = protonConfig?.APP_NAME === APPS.PROTONMAIL || protonConfig?.APP_NAME === APPS.PROTONACCOUNT;
    const createDate = subscription?.CreateTime ? fromUnixTime(subscription.CreateTime) : new Date();
    const plan = getPlan(subscription);
    return (
        [PLANS.MAIL, PLANS.VPN].includes(plan?.Name as PLANS) &&
        !isTrial(subscription) &&
        isBefore(createDate, addDays(new Date(), -7)) &&
        user.canPay &&
        isValidApp &&
        !user.isDelinquent &&
        !isManagedExternally(subscription)
    );
};

export default isEligible;
