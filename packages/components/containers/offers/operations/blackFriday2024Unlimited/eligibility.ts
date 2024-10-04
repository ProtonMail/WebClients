import { fromUnixTime, isBefore } from 'date-fns';

import { PLANS } from '@proton/payments/index';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, COUPON_CODES } from '@proton/shared/lib/constants';
import { getHasCoupon, getPlan, hasMonthly, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
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
    const hasUnlimited = plan?.Name === PLANS.BUNDLE;

    const isMonthly = hasMonthly(subscription);
    const hasDegoogleCoupon = getHasCoupon(subscription, COUPON_CODES.DEGOOGLE);
    const unLimited1MonthWithDegoogleCoupon = hasUnlimited && isMonthly && hasDegoogleCoupon;

    const hasValidApp =
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE) ||
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONVPN_SETTINGS) ||
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONPASS) ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        protonConfig.APP_NAME === APPS.PROTONMAIL ||
        protonConfig.APP_NAME === APPS.PROTONDRIVE ||
        protonConfig.APP_NAME === APPS.PROTONVPN_SETTINGS ||
        protonConfig.APP_NAME === APPS.PROTONPASS;

    const { canPay, isDelinquent } = user;
    const notDelinquent = !isDelinquent;
    const isNotExternal = !isManagedExternally(subscription);
    const hasBF2024Coupon = hasOneBF2024Coupon(subscription);

    const isPreferredCurrencyEligible = hasEligibileCurrencyForBF(preferredCurrency);

    return (
        hasValidApp &&
        isNotExternal &&
        canPay &&
        notDelinquent &&
        isPreferredCurrencyEligible &&
        hasUnlimited &&
        !unLimited1MonthWithDegoogleCoupon &&
        !hasBF2024Coupon &&
        isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT)
    );
};

export default isEligible;
