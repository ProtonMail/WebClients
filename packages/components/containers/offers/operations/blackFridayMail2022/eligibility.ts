import { APPS, PLANS } from '@proton/shared/lib/constants';
import {
    getPlan,
    hasVPNBlackFridayDiscount,
    isManagedExternally,
    isTrial,
} from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    user: UserModel;
}

const isEligible = ({ subscription, protonConfig, user }: Props) => {
    const plan = getPlan(subscription);
    const hasPaidPlan = plan?.Name === PLANS.MAIL || plan?.Name === PLANS.DRIVE || plan?.Name === PLANS.VPN;
    const isValidApp =
        protonConfig?.APP_NAME === APPS.PROTONMAIL ||
        protonConfig?.APP_NAME === APPS.PROTONACCOUNT ||
        protonConfig?.APP_NAME === APPS.PROTONACCOUNTLITE;
    const noBFVPN = !hasVPNBlackFridayDiscount(subscription);
    const notTrial = !isTrial(subscription);
    const isNotExternal = !isManagedExternally(subscription);
    return hasPaidPlan && notTrial && isNotExternal && user.canPay && isValidApp && !user.isDelinquent && noBFVPN;
};

export default isEligible;
