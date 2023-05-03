import { APPS, CYCLE, PLANS } from '@proton/shared/lib/constants';
import { getPlan, hasBlackFridayDiscount, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
}

const isEligible = ({ user, subscription, protonConfig }: Props) => {
    const plan = getPlan(subscription);
    const noBF = !hasBlackFridayDiscount(subscription);
    const isVpnApp = protonConfig.APP_NAME === APPS.PROTONVPN_SETTINGS;
    return (
        plan?.Name === PLANS.VPN &&
        subscription?.Cycle === CYCLE.YEARLY &&
        !user.hasPaidMail &&
        noBF &&
        user.canPay &&
        isVpnApp &&
        !user.isDelinquent &&
        !isManagedExternally(subscription)
    );
};

export default isEligible;
