import { APPS, PLANS } from '@proton/shared/lib/constants';
import { getPlan, hasVPNBlackFridayDiscount, isExternal, isTrial } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    user: UserModel;
}

const isEligible = ({ subscription, protonConfig, user }: Props) => {
    const plan = getPlan(subscription);
    const hasPaidPlan = plan?.Name === PLANS.MAIL || plan?.Name === PLANS.DRIVE || plan?.Name === PLANS.VPN;
    const isVpnApp = protonConfig?.APP_NAME === APPS.PROTONVPN_SETTINGS;
    const noBFVPN = !hasVPNBlackFridayDiscount(subscription);
    const notTrial = !isTrial(subscription);
    const isNotExternal = !isExternal(subscription);
    return hasPaidPlan && notTrial && isNotExternal && user.canPay && !isVpnApp && !user.isDelinquent && noBFVPN;
};

export default isEligible;
