import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, PLANS } from '@proton/shared/lib/constants';
import { getPlan, isManagedExternally, isTrial } from '@proton/shared/lib/helpers/subscription';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription: Subscription;
    user: UserModel;
    protonConfig: ProtonConfig;
}

const isEligible = ({ subscription, user, protonConfig }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const plan = getPlan(subscription);
    const hasPlus = plan?.Name === PLANS.MAIL;
    const hasValidApp =
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR) ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        protonConfig.APP_NAME === APPS.PROTONMAIL;
    const { canPay, isDelinquent } = user;
    const isNotExternal = !isManagedExternally(subscription);
    const notTrial = !isTrial(subscription);
    const isNotDelinquent = !isDelinquent;

    return hasValidApp && hasPlus && canPay && isNotExternal && notTrial && isNotDelinquent;
};

export default isEligible;
