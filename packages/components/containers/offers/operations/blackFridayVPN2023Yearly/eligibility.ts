import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, COUPON_CODES, PLANS } from '@proton/shared/lib/constants';
import { getPlan, hasFifteen, hasYearly, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription: Subscription;
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
    const hasBFOffer = subscription?.CouponCode === COUPON_CODES.BLACK_FRIDAY_2023;

    return hasValidApp && isNotExternal && canPay && notDelinquent && hasVPN && (isYearly || isFifteen) && !hasBFOffer;
};

export default isEligible;
