import { fromUnixTime, isBefore } from 'date-fns';

import { PLANS } from '@proton/payments/index';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, COUPON_CODES } from '@proton/shared/lib/constants';
import {
    getHasCoupon,
    getPlan,
    hasMonthly,
    isManagedExternally,
    isTrial,
} from '@proton/shared/lib/helpers/subscription';
import type { Currency, ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import hasOneBF2024Coupon from '../../helpers/hasBF2024Coupons';
import hasEligibileCurrencyForBF from '../../helpers/hasEligibileCurrencyForBF';
import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';

interface Props {
    subscription?: Subscription;
    user: UserModel;
    protonConfig: ProtonConfig;
    lastSubscriptionEnd?: number;
    preferredCurrency: Currency;
}

const isEligible = ({ subscription, user, protonConfig, lastSubscriptionEnd = 0, preferredCurrency }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const plan = getPlan(subscription);
    const isMonthly = hasMonthly(subscription);
    const hasPlus =
        plan?.Name === PLANS.MAIL ||
        plan?.Name === PLANS.DRIVE ||
        plan?.Name === PLANS.VPN ||
        plan?.Name === PLANS.VPN2024;
    const hasVPNPlus = plan?.Name === PLANS.VPN || plan?.Name === PLANS.VPN2024;
    const hasVPNPlus1month = isMonthly && hasVPNPlus;

    const hasUnlimited = plan?.Name === PLANS.BUNDLE;
    const hasDegoogleCoupon = getHasCoupon(subscription, COUPON_CODES.DEGOOGLE);
    const unLimited1MonthWithDegoogleCoupon = hasUnlimited && isMonthly && hasDegoogleCoupon;

    const hasValidApp =
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE) ||
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONVPN_SETTINGS) ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        protonConfig.APP_NAME === APPS.PROTONMAIL ||
        protonConfig.APP_NAME === APPS.PROTONDRIVE ||
        protonConfig.APP_NAME === APPS.PROTONVPN_SETTINGS;
    const { canPay, isDelinquent } = user;
    const isNotExternal = !isManagedExternally(subscription);
    const notTrial = !isTrial(subscription);
    const isNotDelinquent = !isDelinquent;
    const hasBF2024Coupon = hasOneBF2024Coupon(subscription);

    const isPreferredCurrencyEligible = hasEligibileCurrencyForBF(preferredCurrency);

    // ( all Plus plan (MAIL/DRIVE/VPN) OR All Unlimited 1month Degoogle ), except VPN 1 MONTH PLUS (different promo)
    return (
        hasValidApp &&
        (hasPlus || unLimited1MonthWithDegoogleCoupon) &&
        !hasVPNPlus1month &&
        !hasBF2024Coupon &&
        canPay &&
        isNotExternal &&
        notTrial &&
        isNotDelinquent &&
        isPreferredCurrencyEligible &&
        isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT)
    );
};

export default isEligible;
