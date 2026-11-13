import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { getPreferredCurrency } from '@proton/payments/core/currencies';

import { useMultiSubscriptionContext } from '../react-extensions/useMultiSubscriptionContext';

export const useAutomaticCurrency = () => {
    const [user, userLoading] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const multiSubscriptionContext = useMultiSubscriptionContext(subscription);
    const [plans, plansLoading] = usePlans();
    const [status, statusLoading] = usePaymentStatus();

    const loading = userLoading || subscriptionLoading || plansLoading || statusLoading;

    const currency = getPreferredCurrency({
        user,
        plans: plans?.plans,
        paymentStatus: status,
        multiSubscriptionContext,
    });

    return [currency, loading] as const;
};
