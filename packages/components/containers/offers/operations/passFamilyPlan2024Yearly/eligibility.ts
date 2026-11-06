import { PLANS } from '@proton/payments/core/constants';
import { type MaybeFreeSubscription, canModify } from '@proton/payments/core/subscription/helpers';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';

interface Props {
    subscription: MaybeFreeSubscription;
    multiSubscriptionContext: MultiSubscriptionContext;
    user: UserModel;
    protonConfig: ProtonConfig;
}

export const getIsEligible = ({ subscription, multiSubscriptionContext, user, protonConfig }: Props): boolean => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp = protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONPASS;

    const { canPay, isDelinquent, isFree } = user;
    const notDelinquent = !isDelinquent;
    const canModifySubscription = canModify(multiSubscriptionContext);
    const cohortPass2023 = subscription?.Plans?.some((plan) => plan.Name === PLANS.PASS) ?? false;

    return hasValidApp && canPay && notDelinquent && canModifySubscription && (isFree || cohortPass2023);
};
