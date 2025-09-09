import type { Subscription } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { whichAppsUserBought } from '../../helpers/backToSchool';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
}

export const getIsEligible = ({ user, subscription, protonConfig }: Props) => {
    if (user.isDelinquent || !user.canPay || !subscription || subscription.UpcomingSubscription) {
        return false;
    }

    const offerSubscription = new OfferSubscription(subscription);
    const notBundle = !offerSubscription.hasBundle();
    const notDuo = !offerSubscription.hasDuo();
    const notUsedCurrentPromo = !offerSubscription.usedBackToSchoolPromo();

    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const isInMail =
        protonConfig.APP_NAME === APPS.PROTONMAIL ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR);
    const isInDrive =
        protonConfig.APP_NAME === APPS.PROTONDRIVE ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE);
    const isInPass =
        protonConfig.APP_NAME === APPS.PROTONPASS ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONPASS);
    const hasValidApp =
        protonConfig.APP_NAME === APPS.PROTONVPN_SETTINGS ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONVPN_SETTINGS);

    const { hasMail, hasDrive, hasPass, hasVPN } = whichAppsUserBought(subscription);
    const isInTheAppTheyBought =
        (isInMail && hasMail) || (isInDrive && hasDrive) || (isInPass && hasPass) || (hasValidApp && hasVPN);

    if (user.isPaid && isInTheAppTheyBought && notBundle && notDuo && notUsedCurrentPromo) {
        return true;
    }

    return false;
};
