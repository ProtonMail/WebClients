import { PLANS, type Subscription, canModify } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: Subscription;
    user: UserModel;
    protonConfig: ProtonConfig;
}

export const getIsEligible = ({ subscription, user, protonConfig }: Props): boolean => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp = protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONPASS;

    const { canPay, isDelinquent, isFree } = user;
    const notDelinquent = !isDelinquent;
    const canModifySubscription = canModify(subscription);
    const cohortPass2023 = subscription?.Plans?.some((plan) => plan.Name === PLANS.PASS) ?? false;

    return hasValidApp && canPay && notDelinquent && canModifySubscription && (isFree || cohortPass2023);
};
