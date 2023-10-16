import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, PLANS } from '@proton/shared/lib/constants';
import { getPlan, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription: Subscription;
    protonConfig: ProtonConfig;
    user: UserModel;
}

const isEligible = ({ subscription, protonConfig, user }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const plan = getPlan(subscription);
    const hasUnlimited = plan?.Name === PLANS.BUNDLE;
    const hasValidApp =
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR) ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        protonConfig.APP_NAME === APPS.PROTONMAIL;
    const { canPay, isDelinquent } = user;
    const isNotExternal = !isManagedExternally(subscription);
    const isNotDelinquent = !isDelinquent;

    return hasValidApp && hasUnlimited && canPay && isNotExternal && isNotDelinquent;
};

export default isEligible;
