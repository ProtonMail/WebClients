import { APPS, CYCLE, PLANS } from '@proton/shared/lib/constants';
import { getPlan, hasBlackFridayDiscount, isManagedExternally, isTrial } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    protonConfig: ProtonConfig;
    subscription?: Subscription;
    user: UserModel;
}

const isEligible = ({ protonConfig, subscription, user }: Props) => {
    const plan = getPlan(subscription);
    const isVpnApp = protonConfig.APP_NAME === APPS.PROTONVPN_SETTINGS;
    const noBF = !hasBlackFridayDiscount(subscription);
    const notTrial = !isTrial(subscription);

    return (
        ((plan?.Name === PLANS.MAIL && notTrial && !user.hasPaidVpn) ||
            (plan?.Name === PLANS.DRIVE && !user.hasPaidVpn && noBF) ||
            (plan?.Name === PLANS.VPN && subscription?.Cycle === CYCLE.TWO_YEARS && !user.hasPaidMail && noBF) ||
            (plan?.Name === PLANS.BUNDLE &&
                [CYCLE.MONTHLY, CYCLE.YEARLY].includes(subscription?.Cycle as CYCLE) &&
                noBF)) &&
        user.canPay &&
        isVpnApp &&
        !user.isDelinquent &&
        !isManagedExternally(subscription)
    );
};

export default isEligible;
