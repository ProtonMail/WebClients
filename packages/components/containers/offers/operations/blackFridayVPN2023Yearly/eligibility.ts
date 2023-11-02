import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, PLANS } from '@proton/shared/lib/constants';
import { getPlan, hasFifteen, hasYearly, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, SubscriptionModel, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription: SubscriptionModel;
    protonConfig: ProtonConfig;
    user: UserModel;
}

const isEligible = ({ subscription, protonConfig, user }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const plan = getPlan(subscription);
    const hasVPN = plan?.Name === PLANS.VPN;
    const isYearly = hasYearly(subscription);
    const isFifteen = hasFifteen(subscription);
    const hasValidApp =
        protonConfig?.APP_NAME === APPS.PROTONVPN_SETTINGS ||
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONVPN_SETTINGS);
    const { canPay, isDelinquent } = user;
    const notDelinquent = !isDelinquent;
    const isNotExternal = !isManagedExternally(subscription);

    return hasValidApp && isNotExternal && canPay && notDelinquent && hasVPN && (isYearly || isFifteen);
};

export default isEligible;
