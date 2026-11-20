import { usePayments } from '@proton/payments-hooks/ui/context/paymentsContext';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getChangedSubscription } from '@proton/payments/core/subscription/purchase-outcome';

export const useChangedSubscription = (): Subscription | undefined => {
    const { multiSubscriptionContext, checkoutUi } = usePayments();
    return getChangedSubscription(multiSubscriptionContext, checkoutUi.planIDs);
};
