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
    const isValidApp = protonConfig?.APP_NAME === APPS.PROTONMAIL || protonConfig?.APP_NAME === APPS.PROTONCALENDAR;
    const isFreeSinceAtLeastOneMonth = user.isFree && lastSubscriptionEnd > 0;

    if (!isValidApp) {
        return false;
    }

    if (!user.canPay) {
        return false;
    }

    if (user.isDelinquent) {
        return false;
    }

    if (isTrial(subscription)) {
        return true;
    }

    if (isManagedExternally(subscription)) {
        return false;
    }

    return isFreeSinceAtLeastOneMonth;
};

export default isEligible;
