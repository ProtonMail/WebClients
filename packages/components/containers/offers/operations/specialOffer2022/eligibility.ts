import { APPS, PLANS } from '@proton/shared/lib/constants';
import { getPlan, hasMonthly, isExternal } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
}

const isEligible = ({ user, subscription, protonConfig }: Props) => {
    const isValidApp = protonConfig?.APP_NAME === APPS.PROTONMAIL || protonConfig?.APP_NAME === APPS.PROTONACCOUNT;
    const plan = getPlan(subscription);
    return (
        plan?.Name === PLANS.BUNDLE &&
        hasMonthly(subscription) &&
        user.canPay &&
        isValidApp &&
        !user.isDelinquent &&
        !isExternal(subscription)
    );
};

export default isEligible;
