import { fromUnixTime, isBefore } from 'date-fns';

import { type Subscription } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import isCheckAllowed from '../../helpers/isCheckAllowed';
import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';
import OfferSubscription from '../../helpers/offerSubscription';
import { type OfferConfig } from '../../interface';

interface Props {
    protonConfig: ProtonConfig;
    user: UserModel;
    lastSubscriptionEnd: number;
    subscription?: Subscription;
    offerConfig: OfferConfig;
}

export const getIsEligible = ({ user, protonConfig, lastSubscriptionEnd = 0, subscription, offerConfig }: Props) => {
    if (!subscription) {
        return false;
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        protonConfig.APP_NAME === APPS.PROTONMAIL ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR);
    const checkAllowed = isCheckAllowed(subscription, offerConfig);

    if (user.isPaid) {
        const offerSubscription = new OfferSubscription(subscription);
        const isNotExternal = !offerSubscription.isManagedExternally();
        const hasMailMonthly = offerSubscription.hasMail() && offerSubscription.isMonthly();

        return hasValidApp && checkAllowed && hasMailMonthly && isNotExternal && user.canPay && !user.isDelinquent;
    }

    return (
        hasValidApp &&
        checkAllowed &&
        isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT) &&
        user.canPay &&
        !user.isDelinquent
    );
};
