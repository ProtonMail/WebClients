import { PLANS } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import type { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: Subscription;
    user: UserModel;
    protonConfig: ProtonConfig;
}

const isEligible = ({ subscription, user, protonConfig }: Props): boolean => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp = protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONPASS;

    const { canPay, isDelinquent, isFree } = user;
    const notDelinquent = !isDelinquent;
    const isNotExternal = !isManagedExternally(subscription);
    const cohortPass2023 = subscription?.Plans?.some((plan) => plan.Name === PLANS.PASS) ?? false;

    return hasValidApp && canPay && notDelinquent && isNotExternal && (isFree || cohortPass2023);
};

export default isEligible;
