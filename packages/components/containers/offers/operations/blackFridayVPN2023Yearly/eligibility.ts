import { PLANS } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, COUPON_CODES } from '@proton/shared/lib/constants';
import {
    getHasCoupon,
    getPlan,
    hasFifteen,
    hasYearly,
    isManagedExternally,
} from '@proton/shared/lib/helpers/subscription';
import type { ProtonConfig, SubscriptionModel, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: SubscriptionModel;
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
    const hasBF2023Coupon = getHasCoupon(subscription, COUPON_CODES.BLACK_FRIDAY_2023);

    return (
        hasValidApp && isNotExternal && canPay && notDelinquent && hasVPN && !hasBF2023Coupon && (isYearly || isFifteen)
    );
};

export default isEligible;
