import { usePaymentStatus, usePlans, useSubscription, useUser } from '@proton/components/hooks';

import { useCurrencies } from './useCurrencies';

export const useAutomaticCurrency = () => {
    const { getPreferredCurrency } = useCurrencies();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [plans] = usePlans();
    const [status] = usePaymentStatus();

    return getPreferredCurrency({
        user,
        plans: plans?.plans,
        status,
        subscription,
    });
};
