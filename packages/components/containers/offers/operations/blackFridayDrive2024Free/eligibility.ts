import { fromUnixTime, isBefore } from 'date-fns';

import { type Currency } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import type { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

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
    const hasValidApp =
        protonConfig?.APP_NAME === APPS.PROTONDRIVE ||
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE);
    const { canPay, isDelinquent, isFree } = user;
    const notDelinquent = !isDelinquent;
    const isNotExternal = !isManagedExternally(subscription);

    const isPreferredCurrencyEligible = hasEligibileCurrencyForBF(preferredCurrency);

    return (
        hasValidApp &&
        isNotExternal &&
        canPay &&
        notDelinquent &&
        isPreferredCurrencyEligible &&
        isFree &&
        isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT)
    );
};

export default isEligible;
