import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import {
    getHasB2BPlan,
    hasFamily,
    hasNewVisionary,
    hasVisionary,
    isExternal,
    isTrial,
} from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
}

const isEligible = ({ user, subscription, protonConfig }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const isValidApp = user.isFree
        ? protonConfig.APP_NAME === APPS.PROTONDRIVE ||
          (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE) ||
          (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL)
        : protonConfig.APP_NAME === APPS.PROTONACCOUNT ||
          protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
          protonConfig.APP_NAME === APPS.PROTONDRIVE ||
          protonConfig.APP_NAME === APPS.PROTONVPN_SETTINGS ||
          protonConfig.APP_NAME === APPS.PROTONMAIL;
    if (!isValidApp) {
        return false;
    }
    if (user.isDelinquent) {
        return false;
    }
    if (!user.canPay) {
        return false;
    }
    if (hasFamily(subscription)) {
        return false;
    }
    if (getHasB2BPlan(subscription)) {
        return false;
    }
    if (hasVisionary(subscription)) {
        return false;
    }
    if (hasNewVisionary(subscription)) {
        return false;
    }
    if (isTrial(subscription)) {
        return false;
    }
    if (isExternal(subscription)) {
        return false;
    }
    return true;
};

export default isEligible;
