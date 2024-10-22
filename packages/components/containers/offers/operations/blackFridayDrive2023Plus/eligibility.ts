import { PLANS } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, COUPON_CODES } from '@proton/shared/lib/constants';
import { getHasCoupon, getPlan, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import type { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    user: UserModel;
}

const isEligible = ({ subscription, protonConfig, user }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const plan = getPlan(subscription);
    const hasDrive = plan?.Name === PLANS.DRIVE;
    const hasValidApp =
        protonConfig?.APP_NAME === APPS.PROTONDRIVE ||
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE);
    const { canPay, isDelinquent } = user;
    const notDelinquent = !isDelinquent;
    const isNotExternal = !isManagedExternally(subscription);
    const hasBF2023Coupon = getHasCoupon(subscription, COUPON_CODES.BLACK_FRIDAY_2023);

    return hasValidApp && isNotExternal && canPay && notDelinquent && hasDrive && !hasBF2023Coupon;
};

export default isEligible;
