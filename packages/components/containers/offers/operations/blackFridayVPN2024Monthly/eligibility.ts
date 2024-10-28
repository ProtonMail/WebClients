import { fromUnixTime, isBefore } from 'date-fns';

import { PLANS } from '@proton/payments/index';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { getPlan, hasMonthly, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
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

const isEligible = ({ subscription, protonConfig, user, lastSubscriptionEnd = 0, preferredCurrency }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const plan = getPlan(subscription);
    const isMonthly = hasMonthly(subscription);
    const hasVPNPlus = plan?.Name === PLANS.VPN || plan?.Name === PLANS.VPN2024;

    const hasValidApp =
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONVPN_SETTINGS) ||
        protonConfig.APP_NAME === APPS.PROTONVPN_SETTINGS;
    const { canPay, isDelinquent } = user;
    const isNotExternal = !isManagedExternally(subscription);
    const isNotDelinquent = !isDelinquent;
    const hasBF2024Coupon = hasOneBF2024Coupon(subscription);
    const hasVPNPlus1month = isMonthly && hasVPNPlus;

    const isPreferredCurrencyEligible = hasEligibileCurrencyForBF(preferredCurrency);

    // only VPN 1 MONTH PLUS
    return (
        hasValidApp &&
        hasVPNPlus1month &&
        !hasBF2024Coupon &&
        canPay &&
        isNotExternal &&
        isNotDelinquent &&
        isPreferredCurrencyEligible &&
        isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT)
    );
};

export default isEligible;
