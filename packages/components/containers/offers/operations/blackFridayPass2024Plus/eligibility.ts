import { fromUnixTime, isBefore } from 'date-fns';

import { type Currency, PLANS } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { getPlan, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import type { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import hasOneBF2024Coupon from '../../helpers/hasBF2024Coupons';
import hasEligibileCurrencyForBF from '../../helpers/hasEligibileCurrencyForBF';
import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';

interface Props {
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    user: UserModel;
    lastSubscriptionEnd?: number;
    preferredCurrency: Currency;
}

const isEligible = ({ subscription, protonConfig, user, lastSubscriptionEnd = 0, preferredCurrency }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const plan = getPlan(subscription);
    const hasPlus = plan?.Name === PLANS.PASS;
    const hasValidApp =
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONPASS) ||
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
        hasPlus &&
        !hasBF2024Coupon &&
        isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT)
    );
};

export default isEligible;
