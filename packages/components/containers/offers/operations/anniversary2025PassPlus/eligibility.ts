import { fromUnixTime, isBefore } from 'date-fns';

import { type Subscription } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetime, hasPassViaSimpleLogin } from '@proton/shared/lib/user/helpers';

import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';
import OfferSubscription from '../../helpers/offerSubscription';

interface Props {
    protonConfig: ProtonConfig;
    user: UserModel;
    lastSubscriptionEnd: number;
    subscription?: Subscription;
}

export const getIsEligible = ({ user, subscription, protonConfig, lastSubscriptionEnd = 0 }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        protonConfig.APP_NAME === APPS.PROTONPASS ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONPASS);
    const noPassViaSimpleLogin = !hasPassViaSimpleLogin(user);
    const noPassLifetime = !hasPassLifetime(user);

    if (subscription) {
        const offerSubscription = new OfferSubscription(subscription);
        const isNotExternal = !offerSubscription.isManagedExternally();
        const hasPassMonthly = offerSubscription.hasPass() && offerSubscription.isMonthly();

        return hasValidApp && hasPassMonthly && isNotExternal && noPassLifetime && user.canPay && !user.isDelinquent;
    }

    return (
        hasValidApp &&
        isBefore(fromUnixTime(lastSubscriptionEnd), FREE_DOWNGRADER_LIMIT) &&
        noPassViaSimpleLogin &&
        user.canPay &&
        !user.isDelinquent
    );
};
