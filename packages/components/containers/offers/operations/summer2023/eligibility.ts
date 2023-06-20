import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { isManagedExternally, isTrial } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    lastSubscriptionEnd?: number;
}

const isEligible = ({ user, subscription, protonConfig, lastSubscriptionEnd = 0 }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const isValidApp =
        protonConfig?.APP_NAME === APPS.PROTONMAIL ||
        protonConfig?.APP_NAME === APPS.PROTONCALENDAR ||
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR);
    const hasPreviousSubscription = lastSubscriptionEnd > 0;

    if (!isValidApp) {
        return false;
    }

    if (!user.canPay) {
        return false;
    }

    if (user.isDelinquent) {
        return false;
    }

    if (isManagedExternally(subscription)) {
        return false;
    }

    if (isTrial(subscription)) {
        return true;
    }

    return user.isFree && !hasPreviousSubscription;
};

export default isEligible;
