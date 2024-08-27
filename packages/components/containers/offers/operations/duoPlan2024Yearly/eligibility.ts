import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { hasBundle, hasMonthly, hasYearly, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import type { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: Subscription;
    user: UserModel;
    protonConfig: ProtonConfig;
}

const isEligible = ({ subscription, user, protonConfig }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasUnlimited = hasBundle(subscription);
    const hasOneYear = hasYearly(subscription) || hasMonthly(subscription); // 1 month also goes to 1 year, but not for 2 years
    const hasValidApp =
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR) ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        protonConfig.APP_NAME === APPS.PROTONMAIL;
    const { canPay, isDelinquent } = user;
    const notDelinquent = !isDelinquent;
    const isNotExternal = !isManagedExternally(subscription);

    return hasValidApp && canPay && notDelinquent && hasUnlimited && hasOneYear && isNotExternal;
};

export default isEligible;
