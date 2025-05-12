import { fromUnixTime, isBefore } from 'date-fns';

import { type Subscription } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';
import OfferSubscription from '../../helpers/offerSubscription';

interface Props {
    protonConfig: ProtonConfig;
    user: UserModel;
    lastSubscriptionEnd: number;
    subscription?: Subscription;
}

export const getIsEligible = ({ user, protonConfig, lastSubscriptionEnd = 0, subscription }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        protonConfig.APP_NAME === APPS.PROTONMAIL ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR);

    if (subscription) {
        const offerSubscription = new OfferSubscription(subscription);
        const isNotExternal = !offerSubscription.isManagedExternally();
        const hasMailMonthly = offerSubscription.hasMail() && offerSubscription.isMonthly();

        return hasValidApp && hasMailMonthly && isNotExternal && user.canPay && !user.isDelinquent;
    }

    return (
        hasValidApp &&
        isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT) &&
        user.canPay &&
        !user.isDelinquent
    );
};
