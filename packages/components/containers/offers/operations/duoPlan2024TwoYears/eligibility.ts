import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { hasBundle, hasTwoYears, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import type { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: Subscription;
    user: UserModel;
    protonConfig: ProtonConfig;
}

const isEligible = ({ subscription, user, protonConfig }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasUnlimited = hasBundle(subscription);
    const hasTwoYear = hasTwoYears(subscription);
    const isNotExternal = !isManagedExternally(subscription);

    // check storage and duration
    const hasValidApp =
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR) ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        protonConfig.APP_NAME === APPS.PROTONMAIL;
    const { canPay, isDelinquent } = user;
    const notDelinquent = !isDelinquent;

    return hasValidApp && canPay && notDelinquent && hasUnlimited && hasTwoYear && isNotExternal;
};

export default isEligible;
